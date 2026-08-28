import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import Explore from "./pages/Explore";
import RoutesPage from "./pages/Routes";
import Safety from "./pages/Safety";
import Reports from "./pages/Reports";
import NavigationPage from "./pages/Navigation";
import Profile from "./pages/Profile";

export default function App(){
  return <AppLayout><Routes>
    <Route path="/" element={<Explore/>}/>
    <Route path="/routes" element={<RoutesPage/>}/>
    <Route path="/safety" element={<Safety/>}/>
    <Route path="/reports" element={<Reports/>}/>
    <Route path="/navigation" element={<NavigationPage/>}/>
    <Route path="/profile" element={<Profile/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes></AppLayout>;
}