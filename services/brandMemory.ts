// Stub for brandMemory — no-op implementations to prevent runtime crashes
export const brandMemory = {
  createBrand: async (_name: string, _projectId?: string) => ({ id: `brand_${Date.now()}`, name: _name, colors: [], fonts: [], logos: [] }),
  updateBrand: async (_id: string, _updates: any) => {},
  deleteBrand: async (_id: string) => {},
  checkNodeAgainstBrand: async (_node: any, _brandId: string | null) => [],
  getBrandViolations: () => [],
  checkBrandConsistency: () => ({ violations: [], score: 100 }),
  getActiveBrand: () => null,
  inferBrandFromDesign: async (_name: string, _nodes: any[]) => null,
};

export type BrandViolation = { nodeId: string; property: string; expected: string; actual: string; severity: 'error' | 'warning' };
