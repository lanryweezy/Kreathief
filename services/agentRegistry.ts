import { z } from 'zod';
import { Project, Layer, Artboard } from '../types';

/**
 * ============================================
 * AGENT CAPABILITY REGISTRY & EXECUTION HARNESS
 * ============================================
 * Defines deterministic, versioned, and observable tools for the Creative Agent.
 * Ensures the agent edits the Design AST safely rather than hallucinating flat images.
 */

export type PermissionLevel = 'safe' | 'destructive' | 'external_api' | 'cost_incurring';

export interface CapabilityResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  costIncurred: number; // For tracking AI/API costs
  timestamp: number;
}

export interface CapabilityContext {
  projectId: string;
  activeArtboardId: string;
  userId: string;
}

export interface CapabilityDefinition<TInput = any, TOutput = any> {
  name: string;
  version: string;
  description: string;
  permissionLevel: PermissionLevel;
  baseCostEstimate: number; // Baseline cost in credits/cents
  
  // Zod schemas to enforce strict JSON contracts
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;

  // Execution
  execute: (input: TInput, context: CapabilityContext) => Promise<CapabilityResult<TOutput>>;
  
  // Rollback logic for the Undo strategy
  undo?: (input: TInput, output: TOutput, context: CapabilityContext) => Promise<void>;
  
  // Validation
  validate?: (input: TInput) => boolean | string;
}

class AgentRegistry {
  private capabilities: Map<string, CapabilityDefinition<any, any>> = new Map();

  public register(capability: CapabilityDefinition<any, any>) {
    this.capabilities.set(capability.name, capability);
  }

  public getCapability(name: string) {
    return this.capabilities.get(name);
  }

  public getAllCapabilities() {
    return Array.from(this.capabilities.values());
  }

  /**
   * Safe execution harness with built-in observability and schema validation
   */
  public async executeCapability<TInput, TOutput>(
    name: string, 
    input: TInput, 
    context: CapabilityContext
  ): Promise<CapabilityResult<TOutput>> {
    const cap = this.capabilities.get(name);
    if (!cap) {
      return { success: false, error: `Capability ${name} not found`, costIncurred: 0, timestamp: Date.now() };
    }

    console.log(`[AGENT EXEC] Triggering ${name} v${cap.version}`, input);

    // 1. Schema Validation
    const validationResult = cap.inputSchema.safeParse(input);
    if (!validationResult.success) {
      console.error(`[AGENT EXEC] Validation failed for ${name}:`, validationResult.error);
      return { 
        success: false, 
        error: `Malformed input schema for ${name}: ${validationResult.error.message}`, 
        costIncurred: 0, 
        timestamp: Date.now() 
      };
    }

    // 2. Custom Business Logic Validation
    if (cap.validate) {
      const customValid = cap.validate(input);
      if (customValid !== true) {
        return { success: false, error: customValid as string, costIncurred: 0, timestamp: Date.now() };
      }
    }

    // 3. Execution
    try {
      const result = await cap.execute(input, context);
      
      // 4. Output Schema Validation
      if (result.success && result.data) {
        const outValidation = cap.outputSchema.safeParse(result.data);
        if (!outValidation.success) {
           console.error(`[AGENT EXEC] Output validation failed for ${name}:`, outValidation.error);
           // Even if execution worked, we fail it if it breaks the AST contract
           return { 
             success: false, 
             error: `Capability produced malformed output: ${outValidation.error.message}`, 
             costIncurred: result.costIncurred, 
             timestamp: Date.now() 
           };
        }
      }

      console.log(`[AGENT EXEC] Success ${name}`);
      return result;

    } catch (err: any) {
      console.error(`[AGENT EXEC] Error in ${name}:`, err);
      return { success: false, error: err.message, costIncurred: 0, timestamp: Date.now() };
    }
  }
}

export const agentRegistry = new AgentRegistry();
