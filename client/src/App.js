import { BrowserRouter,Routes, Route } from 'react-router-dom';
import './App.css';

import Login from './pages/Login.js';
import Registration from './pages/Registration.js';
import Dashboard from './pages/Dashboard.js';

import { SocketProvider } from './context/SocketContext';
function App() {
  const getStoredUser = () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  };
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>} ></Route>
        <Route path='/signup' element={<Registration/>}></Route>
        <Route 
          path='/dashboard' 
          element={
            <SocketProvider currentUser={getStoredUser()}>
              <Dashboard />
            </SocketProvider>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
