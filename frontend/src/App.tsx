import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "./components/Navbar";
import ContractListPage from "./pages/ContractListPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import ContractFormPage from "./pages/ContractFormPage";
import ArchivedPage from "./pages/ArchivedPage";
import ReportingPage from "./pages/ReportingPage";
import ToolListPage from "./pages/ToolListPage";
import ToolDetailPage from "./pages/ToolDetailPage";
import ToolFormPage from "./pages/ToolFormPage";

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<ContractListPage />} />
              <Route path="/contracts/new" element={<ContractFormPage />} />
              <Route path="/contracts/:id" element={<ContractDetailPage />} />
              <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
              <Route path="/tools" element={<ToolListPage />} />
              <Route path="/tools/new" element={<ToolFormPage />} />
              <Route path="/tools/:id" element={<ToolDetailPage />} />
              <Route path="/tools/:id/edit" element={<ToolFormPage />} />
              <Route path="/archived" element={<ArchivedPage />} />
              <Route path="/reports" element={<ReportingPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
