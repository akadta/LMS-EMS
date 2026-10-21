import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import UserProtectedRoutes from "./routes/UserProtectedRoutes";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import CourseList from "./pages/courses/CourseList";
import CreateCourse from "./pages/courses/CreateCourse";
import ModuleList from "./pages/courses/ModuleList";
import ChapterList from "./pages/courses/ChapterList";
import CreateChapter from "./pages/courses/CreateChapter";
import AssessmentBuilder from "./pages/assessments/AssessmentBuilder";
import CourseDemoHome from "./pages/demo/CourseDemoHome";
import ModuleChaptersDemo from "./pages/demo/ModuleChaptersDemo";
import ChapterViewerDemo from "./pages/demo/ChapterViewerDemo";
import AssessmentPlayerDemo from "./pages/assessments/AssessmentPlayerDemo";
import StudentManage from "./pages/students/StudentManage";
import FacultyManage from "./pages/faculty/FacultyManage";
import CompanyManage from "./pages/companies/CompanyManage";
import DepartmentManage from "./pages/departments/DepartmentManage";
import BatchList from "./pages/batches/BatchList";
import BatchDetail from "./pages/batches/BatchDetail";
import BatchCourseAllocation from "./pages/batches/BatchCourseAllocation";

import StudentBatches from "./pages/student/StudentBatches";
import StudentBatchCourses from "./pages/student/StudentBatchCourses";
import StudentModules from "./pages/student/StudentModules";
import StudentChapters from "./pages/student/StudentChapters";
import StudentChapterViewer from "./pages/student/StudentChapterViewer";
import StudentAssessmentPlayer from "./pages/student/StudentAssessmentPlayer";

import FacultyBatches from "./pages/faculty/FacultyBatches";
import FacultyStudentTracking from "./pages/faculty/FacultyStudentTracking";
import FacultyReviewQueue from "./pages/faculty/FacultyReviewQueue";
import FacultyGradeAttempt from "./pages/faculty/FacultyGradeAttempt";

import FacultyStudentOverview from "./pages/faculty/FacultyStudentOverview";
import FacultyStudentModuleDetail from "./pages/faculty/FacultyStudentModuleDetail";
import FacultyAssessmentAttempts from "./pages/faculty/FacultyAssessmentAttempts";
import FacultyAttemptViewer from "./pages/faculty/FacultyAttemptViewer";
import FacultyReviewQueueStudents from "./pages/faculty/FacultyReviewQueueStudents";
import StudentHistory from "./pages/student/StudentHistory";
import StudentHistoryModules from "./pages/student/StudentHistoryModules";
import StudentAttemptDetail from "./pages/student/StudentAttemptDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Login />} />
        <Route element={<UserProtectedRoutes />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/create" element={<CreateCourse />} />
            <Route path="/courses/:courseId/modules" element={<ModuleList />} />
            <Route
              path="/courses/:courseId/modules/:moduleId/chapters"
              element={<ChapterList />}
            />
            <Route
              path="/courses/:courseId/modules/:moduleId/chapters/create"
              element={<CreateChapter />}
            />
            <Route
              path="/courses/:courseId/modules/:moduleId/chapters/:chapterId/edit"
              element={<CreateChapter />}
            />

            <Route path="/assessments/:id" element={<AssessmentBuilder />} />

            {/**DEMO */}
            <Route
              path="/courses/:courseId/demo"
              element={<CourseDemoHome />}
            />
            <Route
              path="/courses/:courseId/demo/modules/:moduleId"
              element={<ModuleChaptersDemo />}
            />
            <Route
              path="/courses/:courseId/demo/modules/:moduleId/chapters/:chapterId"
              element={<ChapterViewerDemo />}
            />
            <Route
              path="/courses/:courseId/demo/assessment/:assessmentId"
              element={<AssessmentPlayerDemo />}
            />
            {/**END DEMO */}
            <Route path="/students" element={<StudentManage />} />
            <Route path="/faculty" element={<FacultyManage />} />

            <Route path="/companies" element={<CompanyManage />} />
            <Route
              path="/companies/:companyId/departments"
              element={<DepartmentManage />}
            />
            <Route path="/departments" element={<DepartmentManage />} />

            <Route path="/batches" element={<BatchList />} />
            <Route path="/batches/:batchId" element={<BatchDetail />} />
            <Route
              path="/batches/:batchId/courses/:batchCourseId"
              element={<BatchCourseAllocation />}
            />

            <Route path="/student/batches" element={<StudentBatches />} />
            <Route
              path="/student/batches/:batchId"
              element={<StudentBatchCourses />}
            />
            <Route
              path="/student/courses/:courseId/modules"
              element={<StudentModules />}
            />
            <Route
              path="/student/modules/:moduleId/chapters"
              element={<StudentChapters />}
            />
            <Route
              path="/student/chapters/:chapterId"
              element={<StudentChapterViewer />}
            />
            <Route
              path="/student/assessment/:assessmentId"
              element={<StudentAssessmentPlayer />}
            />

            <Route path="/student/history" element={<StudentHistory />} />
            <Route
              path="/student/history/courses/:courseId"
              element={<StudentHistoryModules />}
            />
            <Route
              path="/student/history/attempts/:attemptId"
              element={<StudentAttemptDetail />}
            />

            <Route path="/faculty/batches" element={<FacultyBatches />} />
            <Route
              path="/faculty/batch-courses/:batchCourseId"
              element={<FacultyStudentTracking />}
            />
            <Route
              path="/faculty/batch-courses/:batchCourseId/students/:studentId"
              element={<FacultyStudentOverview />}
            />
            <Route
              path="/faculty/batch-courses/:batchCourseId/students/:studentId/modules/:moduleId"
              element={<FacultyStudentModuleDetail />}
            />
            <Route
              path="/faculty/students/:studentId/assessments/:assessmentId/attempts"
              element={<FacultyAssessmentAttempts />}
            />
            <Route
              path="/faculty/attempts/:attemptId/view"
              element={<FacultyAttemptViewer />}
            />
            <Route
              path="/faculty/review-queue"
              element={<FacultyReviewQueue />}
            />
            <Route
              path="/faculty/review-queue/:batchCourseId"
              element={<FacultyReviewQueueStudents />}
            />
            <Route
              path="/faculty/attempts/:attemptId"
              element={<FacultyGradeAttempt />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
