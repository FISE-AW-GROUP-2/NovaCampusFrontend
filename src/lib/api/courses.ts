/**
 * Course Service API Client
 * Handles all course-related API calls
 */

import { apiClient } from "./client"
import type {
  Course,
  CourseFormData,
  CourseResource,
  Enrollment,
  EnrollmentFormData,
  CoursesListResponse,
  CourseDetailResponse,
  EnrollmentsListResponse,
  CourseQueryParams,
  ResourceType,
} from "@/types/course"

const COURSES_BASE = "/api/courses"

// ==================== Course CRUD (Teacher) ====================

export async function getCoursesApi(params?: CourseQueryParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set("page", params.page.toString())
  if (params?.limit) searchParams.set("limit", params.limit.toString())
  if (params?.search) searchParams.set("search", params.search)
  if (params?.semester) searchParams.set("semester", params.semester)
  if (params?.academicYear) searchParams.set("academicYear", params.academicYear)
  if (params?.isActive !== undefined) searchParams.set("isActive", params.isActive.toString())

  const query = searchParams.toString()
  const endpoint = query ? `${COURSES_BASE}?${query}` : COURSES_BASE
  
  const response = await apiClient.get<CoursesListResponse>(endpoint)
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
  }
}

export async function getCourseByIdApi(courseId: string) {
  const response = await apiClient.get<CourseDetailResponse>(
    `${COURSES_BASE}?id=${encodeURIComponent(courseId)}`
  )
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
  }
}

export async function createCourseApi(data: CourseFormData) {
  const response = await apiClient.post<{ course: Course }>(COURSES_BASE, data)
  return {
    success: !response.error,
    data: response.data?.course,
    error: response.error?.message,
  }
}

export async function updateCourseApi(courseId: string, data: Partial<CourseFormData>) {
  const response = await apiClient.put<{ course: Course }>(COURSES_BASE, { id: courseId, ...data })
  return {
    success: !response.error,
    data: response.data?.course,
    error: response.error?.message,
  }
}

export async function deleteCourseApi(courseId: string) {
  const response = await apiClient.delete(`${COURSES_BASE}?id=${encodeURIComponent(courseId)}`)
  return {
    success: !response.error,
    error: response.error?.message,
  }
}

// ==================== Course Resources (Teacher) ====================

export async function getCourseResourcesApi(courseId: string) {
  const response = await apiClient.get<{ resources: CourseResource[] }>(
    `${COURSES_BASE}/resources?courseId=${encodeURIComponent(courseId)}`
  )
  return {
    success: !response.error,
    data: response.data?.resources,
    error: response.error?.message,
  }
}

export async function uploadCourseResourceApi(
  courseId: string,
  file: File,
  type: ResourceType
): Promise<{ success: boolean; data?: CourseResource; error?: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("type", type)
  formData.append("courseId", courseId)

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${COURSES_BASE}/resources`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `Upload failed with status ${response.status}`,
      }
    }

    const data = await response.json()
    return { success: true, data: data.resource }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error during upload",
    }
  }
}

export async function deleteCourseResourceApi(courseId: string, resourceId: string) {
  const response = await apiClient.delete(
    `${COURSES_BASE}/resources?courseId=${encodeURIComponent(courseId)}&resourceId=${encodeURIComponent(resourceId)}`
  )
  return {
    success: !response.error,
    error: response.error?.message,
  }
}

// ==================== Enrollments (Education Manager) ====================

export async function getCourseEnrollmentsApi(courseId: string) {
  const response = await apiClient.get<EnrollmentsListResponse>(
    `${COURSES_BASE}/enrollments?courseId=${encodeURIComponent(courseId)}`
  )
  return {
    success: !response.error,
    data: response.data,
    error: response.error?.message,
  }
}

export async function enrollStudentApi(courseId: string, data: EnrollmentFormData) {
  const response = await apiClient.post<{ enrollment: Enrollment }>(
    `${COURSES_BASE}/enroll`,
    { courseId, ...data }
  )
  return {
    success: !response.error,
    data: response.data?.enrollment,
    error: response.error?.message,
  }
}

export async function unenrollStudentApi(courseId: string, enrollmentId: string) {
  const response = await apiClient.delete(
    `${COURSES_BASE}/enrollments?courseId=${encodeURIComponent(courseId)}&enrollmentId=${encodeURIComponent(enrollmentId)}`
  )
  return {
    success: !response.error,
    error: response.error?.message,
  }
}

export async function updateEnrollmentStatusApi(
  courseId: string,
  enrollmentId: string,
  status: string
) {
  const response = await apiClient.patch<{ enrollment: Enrollment }>(
    `${COURSES_BASE}/enrollments`,
    { courseId, enrollmentId, status }
  )
  return {
    success: !response.error,
    data: response.data?.enrollment,
    error: response.error?.message,
  }
}

// ==================== Students API (for Education Manager) ====================

export async function getStudentsApi(search?: string) {
  const searchParams = search ? `?search=${encodeURIComponent(search)}` : ""
  const response = await apiClient.get<{
    students: Array<{ id: string; name: string; email: string }>
  }>(`/api/users/students${searchParams}`)
  return {
    success: !response.error,
    data: response.data?.students,
    error: response.error?.message,
  }
}
