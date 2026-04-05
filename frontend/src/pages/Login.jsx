import { useState, useRef, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useCaja } from '../context/CajaContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  /* const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); */
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login } = useContext(AuthContext);
  const { actualizarToken } = useCaja(); // 👈 importamos función para CajaContext
  const navigate = useNavigate();

  useEffect(() => {

    localStorage.removeItem('token');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    try {
      const token = await login(email, password); // 👈 USAR ESTE

      actualizarToken(token); // 👈 ahora SI es válido

      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0f172a]">
      <div className="flex flex-col gap-6 p-8 rounded-2xl bg-[#111827]/90 border-t-4 border-[#35b9ac] shadow-lg shadow-[#35b9ac]/20 w-96">
        <h1 className="text-3xl font-bold text-center text-gray-200">
          Owl<span className="text-[#35b9ac]">Soft</span>
        </h1>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="email"
            ref={emailRef} // usamos ref
            placeholder="Email"
            className="bg-[#1f2937] text-gray-200 border border-gray-700 focus:border-[#35b9ac] focus:ring focus:ring-[#35b9ac]/30 rounded-lg px-3 py-2 placeholder-gray-400 transition-all duration-300"
          />
          <input
            type="password"
            ref={passwordRef} // ✅ contraseña segura
            placeholder="Contraseña"
            className="bg-[#1f2937] text-gray-200 border border-gray-700 focus:border-[#35b9ac] focus:ring focus:ring-[#35b9ac]/30 rounded-lg px-3 py-2 placeholder-gray-400 transition-all duration-300"
          />
          <button
            type="submit"
            className="
              bg-[#35b9ac] cursor-pointer text-gray-900 font-semibold
              p-2 rounded-lg w-full
              hover:bg-[#2fa69e] hover:shadow-lg hover:shadow-[#35b9ac]/30
              transition-all duration-300
            "
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}