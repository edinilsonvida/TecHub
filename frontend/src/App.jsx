import { Route, Routes } from "react-router-dom";

import EmptyState from "./components/EmptyState";
import Header from "./components/Header";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import SignUpPage from "./pages/SignUpPage";

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route path="/projetos" element={<ProjectsPage />} />
          <Route path="/projeto/novo" element={<NewProjectPage />} />

          <Route path="/cadastro" element={<SignUpPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="*"
            element={
              <EmptyState
                icon="compass"
                title="Página não encontrada"
                description="Verifique o endereço e tente novamente."
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}
