import { api } from './apiClient'
import type { ReplayState } from '../types/OptionsContract'

export const replayService = {
  start: (instrumentId: number, from: string, to: string, speed = 1) =>
    api.post<ReplayState>('/replay/start', { instrumentId, from, to, speed }),

  stop: (instrumentId: number) =>
    api.post<void>('/replay/stop', { instrumentId }),

  pause: (instrumentId: number) =>
    api.post<void>('/replay/pause', { instrumentId }),

  resume: (instrumentId: number) =>
    api.post<void>('/replay/resume', { instrumentId }),

  getState: (instrumentId: number) =>
    api.get<ReplayState>(`/replay/state?instrumentId=${instrumentId}`),
}
