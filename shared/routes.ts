import { z } from 'zod';
import { 
  insertProfileSchema, 
  insertCustomerSchema, 
  insertVehicleSchema, 
  insertPartSchema, 
  insertJobCardSchema, 
  insertTaskSchema,
  insertTaskPartSchema,
  profiles,
  customers,
  vehicles,
  parts,
  jobCards,
  tasks,
  taskParts,
  timelineEvents
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  profiles: {
    me: {
      method: 'GET' as const,
      path: '/api/profiles/me',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/profiles/me',
      input: insertProfileSchema.partial(),
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
      },
    },
  },
  customers: {
    list: {
      method: 'GET' as const,
      path: '/api/customers',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof customers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/customers/:id',
      responses: {
        200: z.custom<typeof customers.$inferSelect & { vehicles: typeof vehicles.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/customers',
      input: insertCustomerSchema,
      responses: {
        201: z.custom<typeof customers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  vehicles: {
    list: {
      method: 'GET' as const,
      path: '/api/vehicles',
      responses: {
        200: z.array(z.custom<typeof vehicles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vehicles',
      input: insertVehicleSchema,
      responses: {
        201: z.custom<typeof vehicles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  parts: {
    list: {
      method: 'GET' as const,
      path: '/api/parts',
      responses: {
        200: z.array(z.custom<typeof parts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/parts',
      input: insertPartSchema,
      responses: {
        201: z.custom<typeof parts.$inferSelect>(),
      },
    },
  },
  jobCards: {
    list: {
      method: 'GET' as const,
      path: '/api/job-cards',
      input: z.object({
        status: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof jobCards.$inferSelect & { 
          vehicle: typeof vehicles.$inferSelect,
          customer: typeof customers.$inferSelect 
        }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/job-cards/:id',
      responses: {
        200: z.custom<typeof jobCards.$inferSelect & {
          vehicle: typeof vehicles.$inferSelect,
          customer: typeof customers.$inferSelect,
          tasks: (typeof tasks.$inferSelect & { parts: (typeof taskParts.$inferSelect & { part: typeof parts.$inferSelect })[] })[],
          timeline: typeof timelineEvents.$inferSelect[]
        }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/job-cards',
      input: insertJobCardSchema,
      responses: {
        201: z.custom<typeof jobCards.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/job-cards/:id',
      input: insertJobCardSchema.partial(),
      responses: {
        200: z.custom<typeof jobCards.$inferSelect>(),
      },
    },
    aiInsight: {
      method: 'POST' as const,
      path: '/api/job-cards/:id/ai-insight',
      responses: {
        200: z.object({ insight: z.string() }),
      }
    }
  },
  tasks: {
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
      },
    },
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
