// VYNORA UNIFIED BACKEND REST CLIENT

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('/api') ? path : `/api/v1${path}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg =
      typeof data.error === 'string'
        ? data.error
        : data.error?.message || data.message || `HTTP ${response.status}: Failed to complete request`;
    throw new Error(errMsg);
  }

  return data as T;
}

export const authApi = {
  me: () => request<{ student: any; authenticated: boolean; role?: string; profileCompleted?: boolean }>('/auth/me'),
  login: (email: string, password: string) =>
    request<{ student: any; profileCompleted?: boolean }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  google: (credential: string) =>
    request<{ student: any; isNewUser: boolean; profileCompleted: boolean }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    }),
  adminLogin: (email: string, password: string) =>
    request<{ admin: any; message: string }>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (payload: any) =>
    request<{ student: any; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  logout: () =>
    request<{ ok: boolean; message: string }>('/auth/logout', {
      method: 'POST'
    }),
  academicOptions: () =>
    request<{ years: string[]; departments: string[]; interests: string[]; options: any[] }>('/auth/academic-options')
};

export const usersApi = {
  list: (params: { q?: string; dept?: string; skill?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    if (params.dept && params.dept !== 'All') sp.set('dept', params.dept);
    if (params.skill) sp.set('skill', params.skill);
    return request<{ users: any[]; total: number }>(`/users?${sp.toString()}`);
  },
  get: (id: string) => request<{ user: any }>(`/users/${id}`),
  updateProfile: (updates: any) =>
    request<{ student: any }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
};

export const clubsApi = {
  list: (params: { category?: string; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.category && params.category !== 'All') sp.set('category', params.category);
    if (params.q) sp.set('q', params.q);
    return request<{ clubs: any[] }>(`/clubs?${sp.toString()}`);
  },
  get: (id: string) => request<{ club: any; announcements: any[]; events: any[]; isMember: boolean }>(`/clubs/${id}`),
  createApplication: (payload: { name: string; description: string; category: string; facultyCoordinator?: string }) =>
    request<{ club: any; message: string }>('/clubs', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  join: (id: string) =>
    request<{ success: boolean; message: string }>(`/clubs/${id}/join`, {
      method: 'POST'
    }),
  leave: (id: string) =>
    request<{ success: boolean; message: string }>(`/clubs/${id}/leave`, {
      method: 'DELETE'
    })
};

export const announcementsApi = {
  list: (params: { category?: string; priority?: string; official?: boolean; clubId?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.category) sp.set('category', params.category);
    if (params.priority) sp.set('priority', params.priority);
    if (params.official !== undefined) sp.set('official', String(params.official));
    if (params.clubId) sp.set('clubId', params.clubId);
    return request<{ announcements: any[] }>(`/announcements?${sp.toString()}`);
  },
  create: (payload: { title: string; body: string; clubId?: string; category?: string; priority?: string; isOfficial?: boolean }) =>
    request<{ announcement: any }>('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/announcements/${id}`, {
      method: 'DELETE'
    })
};

export const eventsApi = {
  list: (params: { category?: string; clubId?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.category && params.category !== 'All') sp.set('category', params.category);
    if (params.clubId) sp.set('clubId', params.clubId);
    return request<{ events: any[] }>(`/events?${sp.toString()}`);
  },
  get: (id: string) => request<{ event: any; isRegistered: boolean }>(`/events/${id}`),
  create: (payload: any) =>
    request<{ event: any }>('/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  register: (id: string) =>
    request<{ success: boolean; message: string; registeredCount: number }>(`/events/${id}/register`, {
      method: 'POST'
    }),
  cancelRegistration: (id: string) =>
    request<{ success: boolean; message: string; registeredCount: number }>(`/events/${id}/register`, {
      method: 'DELETE'
    })
};

export const projectsApi = {
  list: (params: { status?: string; recruiting?: boolean; skill?: string; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.status && params.status !== 'All projects') sp.set('status', params.status);
    if (params.recruiting !== undefined) sp.set('recruiting', String(params.recruiting));
    if (params.skill) sp.set('skill', params.skill);
    if (params.q) sp.set('q', params.q);
    return request<{ projects: any[] }>(`/projects?${sp.toString()}`);
  },
  get: (id: string) => request<{ project: any; pendingRequests?: any[] }>(`/projects/${id}`),
  create: (payload: any) =>
    request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  join: (id: string, message?: string) =>
    request<{ success: boolean; message: string }>(`/projects/${id}/join`, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),
  requestJoin: (id: string, message?: string) => projectsApi.join(id, message),
  acceptRequest: (id: string, requestId: string) =>
    request<{ success: boolean; project: any }>(`/projects/${id}/accept-request`, {
      method: 'POST',
      body: JSON.stringify({ requestId })
    })
};

export const communityApi = {
  listPosts: (params: { topic?: string; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.topic && params.topic !== 'All activity') sp.set('topic', params.topic);
    if (params.q) sp.set('q', params.q);
    return request<{ posts: any[] }>(`/community/posts?${sp.toString()}`);
  },
  getFeed: (params: { topic?: string; q?: string } = {}) => communityApi.listPosts(params),
  createPost: (payload: { title: string; body: string; topic?: string; category?: string; skills?: string[] }) =>
    request<{ post: any }>('/community/posts', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getComments: (postId: string) => request<{ comments: any[] }>(`/community/posts/${postId}/comments`),
  addComment: (postId: string, body: string) =>
    request<{ comment: any }>(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body })
    }),
  react: (postId: string) =>
    request<{ liked: boolean; likesCount: number }>(`/community/posts/${postId}/react`, {
      method: 'POST'
    })
};

export const messagesApi = {
  getConversations: () => request<{ conversations: any[] }>('/conversations'),
  getMessages: (conversationId: string) => request<{ messages: any[] }>(`/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, body: string) =>
    request<{ message: any }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body })
    }),
  startConversation: (targetUserId: string) =>
    request<{ conversation: any }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    })
};

export const notificationsApi = {
  list: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) =>
    request<{ notification: any }>(`/notifications/${id}/read`, {
      method: 'PATCH'
    }),
  markAllRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST'
    })
};

export const timetableApi = {
  week: (batch?: string) => request<any>(`/timetable/week${batch ? `?batch=${encodeURIComponent(batch)}` : ''}`),
  today: (batch?: string) => request<any>(`/timetable/today${batch ? `?batch=${encodeURIComponent(batch)}` : ''}`),
  current: (batch?: string) => request<any>(`/timetable/current${batch ? `?batch=${encodeURIComponent(batch)}` : ''}`),
  options: () => request<{ options: any[] }>('/timetable/options'),
  importCsv: (payload: { degree?: string; program: string; year: string; batch: string; sruBatchCode: string; csvContent: string }) =>
    request<{ success: boolean; message: string; timetable: any }>('/timetable/import-csv', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

export const resourcesApi = {
  list: (params: { format?: string; category?: string; q?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.format && params.format !== 'All') sp.set('format', params.format);
    if (params.category && params.category !== 'All') sp.set('category', params.category);
    if (params.q) sp.set('q', params.q);
    return request<{ resources: any[] }>(`/resources?${sp.toString()}`);
  },
  upload: (payload: {
    title: string;
    subject: string;
    category?: string;
    format?: string;
    fileData?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: string;
    url?: string;
  }) =>
    request<{ resource: any }>('/resources', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  download: (id: string) =>
    request<{ resource: any; downloadUrl?: string }>(`/resources/${id}/download`, {
      method: 'POST'
    }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/resources/${id}`, {
      method: 'DELETE'
    })
};

export const servicesApi = {
  list: (params: { category?: string; building?: string } = {}) => {
    const sp = new URLSearchParams();
    if (params.category) sp.set('category', params.category);
    if (params.building && params.building !== 'All') sp.set('building', params.building);
    return request<{ services: any[] }>(`/campus-services?${sp.toString()}`);
  }
};

export const productsApi = {
  list: () => request<{ products: any[] }>('/products'),
  getBySlug: (slug: string) => request<{ product: any }>(`/products/${slug}`),
  order: (productId: string) =>
    request<{ success: boolean; order: any; message: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ productId })
    }),
  myOrders: () => request<{ orders: any[] }>('/orders/me')
};

export const reportsApi = {
  submit: (payload: { targetType: string; targetId: string; targetTitle?: string; reason: string; details?: string }) =>
    request<{ success: boolean; message: string; reportId: string }>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};

export const searchApi = {
  global: (q: string) => request<{ query: string; results: any }>(`/search?q=${encodeURIComponent(q)}`)
};

export const adminApi = {
  getMetrics: () => request<{ metrics: any; recentActivity: any[] }>('/admin/metrics'),
  getUsers: (params: { role?: string; isSuspended?: boolean; q?: string; page?: number } = {}) => {
    const sp = new URLSearchParams();
    if (params.role) sp.set('role', params.role);
    if (params.isSuspended !== undefined) sp.set('isSuspended', String(params.isSuspended));
    if (params.q) sp.set('q', params.q);
    if (params.page) sp.set('page', String(params.page));
    return request<{ users: any[]; total: number; page: number }>(`/admin/users?${sp.toString()}`);
  },
  updateUser: (id: string, updates: { role?: string; isSuspended?: boolean; suspensionReason?: string }) =>
    request<{ user: any }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  getClubs: (status?: string) => request<{ clubs: any[] }>(`/admin/clubs${status ? `?status=${status}` : ''}`),
  approveClub: (id: string) =>
    request<{ club: any; message: string }>(`/admin/clubs/${id}/approve`, {
      method: 'PATCH'
    }),
  rejectClub: (id: string, reason?: string) =>
    request<{ club: any; message: string }>(`/admin/clubs/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    }),
  getReports: (status?: string) => request<{ reports: any[] }>(`/admin/reports${status ? `?status=${status}` : ''}`),
  updateReport: (id: string, updates: { status?: string; actionTaken?: string }) =>
    request<{ report: any; message: string }>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  getAuditLogs: (page = 1) => request<{ logs: any[]; total: number; page: number }>(`/admin/audit-logs?page=${page}`),
  getSettings: () => request<{ settings: any[] }>('/admin/settings'),
  updateSetting: (key: string, value: any, description?: string) =>
    request<{ setting: any }>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key, value, description })
    })
};
