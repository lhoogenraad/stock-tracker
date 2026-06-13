import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

export function App() {
  const token = useAuthStore((s) => s.token);
  return token ? <Dashboard /> : <Login />;
}
