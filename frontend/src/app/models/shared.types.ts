/**
 * Shared TypeScript interfaces and types used across the frontend application.
 * These types mirror the backend API responses for type safety.
 */

// Common Types

/**
 * Standard API response wrapper for paginated data.
 */
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Standard API error response structure.
 */
export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: Array<{
            target: string;
            message: string;
            path: string;
        }>;
    };
}

/**
 * Generic select option type used in dropdowns.
 */
export interface SelectOption<T = string> {
    label: string;
    value: T;
}

// User & Auth Types

export type UserRole = 'admin' | 'technical_director' | 'coach' | 'player';

export type PlayerPosition = 'base' | 'escolta' | 'alero' | 'ala-pivot' | 'pivot';

export type PlayerCategory = 'senior' | 'juvenil' | 'infantil';

export interface UserBase {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole | null;
}

export interface AuthUser extends UserBase {
    token?: string;
}

// Entity Types

export interface ClubBase {
    id: number;
    name: string;
    city?: string | null;
    active?: boolean;
}

export interface TeamBase {
    id: number;
    name: string;
    category: PlayerCategory;
    clubId: number;
}

export interface PlayerBase {
    id: number;
    firstName: string;
    lastName: string;
    position: PlayerPosition;
    category: PlayerCategory;
    teamId: number;
}

export interface ExerciseBase {
    id: number;
    name: string;
    description?: string;
    type: ExerciseType;
    difficulty: number;
}

export type ExerciseType = 'tecnico' | 'tactico' | 'fisico' | 'tiro' | 'defensa' | 'ataque';

// Planning Types

export type PlanningStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface PlanningBase {
    id: number;
    name: string;
    status: PlanningStatus;
    createdAt: string;
    updatedAt: string;
}

// Timestamps

export interface Timestamps {
    createdAt: string;
    updatedAt: string;
}
