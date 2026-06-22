with open('/app/services/authService.test.ts', 'r') as f:
    content = f.read()

content = content.replace("  };\n  return {\n    supabase: mockSupabase,\n    db: mockSupabase,\n  };\n});", "  const mockSupabase = {\n    auth: {\n      signInWithPassword: vi.fn(),\n      signUp: vi.fn(),\n      getSession: vi.fn(),\n      signOut: vi.fn(),\n      onAuthStateChange: vi.fn().mockReturnValue({\n        data: {\n          subscription: {\n            unsubscribe: vi.fn(),\n          },\n        },\n      }),\n    },\n    from: vi.fn().mockReturnValue({\n      select: vi.fn().mockReturnThis(),\n      eq: vi.fn().mockReturnThis(),\n      single: vi.fn(),\n      insert: vi.fn().mockReturnThis(),\n    }),\n  };\n  return {\n    supabase: mockSupabase,\n    db: mockSupabase,\n  };\n});")

with open('/app/services/authService.test.ts', 'w') as f:
    f.write(content)

with open('/app/services/storageService.sync.test.ts', 'r') as f:
    content = f.read()

content = content.replace("  };\n  return {\n    supabase: mockSupabase,\n    db: mockSupabase,\n  };\n});", "  const mockSupabase = {\n    from: vi.fn().mockReturnValue({\n      upsert: vi.fn(),\n      delete: vi.fn().mockReturnThis(),\n      eq: vi.fn().mockReturnThis(),\n      select: vi.fn().mockReturnThis(),\n      single: vi.fn(),\n    }),\n  };\n  return {\n    supabase: mockSupabase,\n    db: mockSupabase,\n  };\n});")

with open('/app/services/storageService.sync.test.ts', 'w') as f:
    f.write(content)
