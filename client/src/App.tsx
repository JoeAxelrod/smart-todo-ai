import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import TodoPage  from "./pages/TodoPage";

export default function App() {
  const [logged, setLogged] = useState(() => !!localStorage.getItem("token"));

  return logged ? <TodoPage/> : <LoginPage onDone={() => setLogged(true)} />;
}
