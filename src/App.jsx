import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Category from "./components/Category";
import PaymentMethod from "./components/PaymentMethod";
import AmountType from "./components/AmountType";
import Expense from "./components/Expense";
import Saving from "./components/Saving";
import Account from "./components/Account";
import Profile from "./components/Profile";
import Notes from "./components/Notes";
import ProtectedRoute from "./components/ProtectedRoute";
import Games from "./components/Games";
import Game2048 from "./components/Game2048";
import SnakeGame from "./components/SnakeGame";
import TicTacToe from "./components/TicTacToe";
import Error from "./components/Error";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="category" element={<Category />} />
          <Route path="payment-method" element={<PaymentMethod />} />
          <Route path="amount-type" element={<AmountType />} />
          <Route path="expense" element={<Expense />} />
          <Route path="saving" element={<Saving />} />
          <Route path="account" element={<Account />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notes" element={<Notes />} />
          <Route path="games" element={<Games />} />
          <Route path="games/2048" element={<Game2048 />} />
          <Route path="games/snake" element={<SnakeGame />} />
          <Route path="games/tictactoe" element={<TicTacToe />} />
        </Route>

        <Route path="*" element={<Error />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </BrowserRouter>
  );
}

export default App;
