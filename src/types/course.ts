// Course Service Types based on the class diagram

export interface Course {
  _id: string
  code: string
  name: string
  description: string
  credits: number
  campusId: string
  teacherId: string
  semester: string
  academicYear: string
  maxStudents: number
  isActive: boolean
  createdAt: string
  enrollmentCount?: number
}

export interface CourseFormData {
  code: string
  name: string
  description: string
  credits: number
  semester: string
  academicYear: string
  maxStudents: number
  isActive?: boolean
}

export enum EnrollmentStatus {
  ACTIVE = "active",
  DROPPED = "dropped",
  COMPLETED = "completed",
}

export interface Enrollment {
  _id: string
  courseId: string
  studentId: string
  enrolledAt: string
  status: EnrollmentStatus
  student?: {
    id: string
    name: string
    email: string
  }
}

export interface EnrollmentFormData {
  studentId: string
}

export enum ResourceType {
  SLIDES = "slides",
  DOCUMENT = "document",
  VIDEO = "video",
  OTHER = "other",
}

export interface CourseResource {
  _id: string
  courseId: string
  uploadedBy: string
  filename: string
  fileUrl: string
  type: ResourceType
  uploadedAt: string
}

export interface ResourceUploadData {
  file: File
  type: ResourceType
}

// API Response types
export interface CoursesListResponse {
  courses: Course[]
  total: number
  page: number
  limit: number
}

export interface CourseDetailResponse {
  course: Course
  resources: CourseResource[]
  enrollments?: Enrollment[]
}

export interface EnrollmentsListResponse {
  enrollments: Enrollment[]
  total: number
}

// Query params
export interface CourseQueryParams {
  page?: number
  limit?: number
  search?: string
  semester?: string
  academicYear?: string
  isActive?: boolean
}
