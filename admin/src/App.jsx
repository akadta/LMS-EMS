import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/auth/Login";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import CreateOrganization from "./pages/organizations/CreateOrganization";
import CentralProtectedRoutes from "./routes/CentralProtectedRoutes";
import OrganizationList from "./pages/organizations/OrganizationList";
import CompanyList from "./pages/companies/CompanyList";
import DepartmentList from "./pages/departments/DepartmentList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Login />} />
        <Route element={<MainLayout />}>
          <Route element={<CentralProtectedRoutes />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/**ORGANIZATIONS */}
            <Route
              path="/create/organization"
              element={<CreateOrganization />}
            />

            <Route path="/list/organizations" element={<OrganizationList />} />
            <Route
              path="/organizations/:organizationId/companies"
              element={<CompanyList />}
            />
            <Route
              path="/organizations/:organizationId/companies/:companyId/departments"
              element={<DepartmentList />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
