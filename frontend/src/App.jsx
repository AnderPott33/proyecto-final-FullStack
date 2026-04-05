// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate  } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import ListaCajas from './pages/ListaCajas';
import RegistrarCaja from './pages/RegistarCaja';
import MovimientosCaja from './pages/MovimientosCaja'
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import PagaValores from './pages/PagaValores';
import RecibeValores from './pages/RecibeValores';
import AnaliticoCuenta from './pages/AnaliticoCuenta';
import CuentasFinancieras from './pages/CuentasFinancieras';
import MovimientosFinancieros from './pages/MovimientosFinancieros';
import Entidades from './pages/Entidades';
import AnaliticoCobrarPagar from './pages/AnaliticoCobrarPagar';
import SaldosCobrarPagar from './pages/SaldosCobrarPagar';
import SaldosCuentas from './pages/SaldosCuentas';
import Cotizaciones from './pages/Cotizaciones';
import Empresa from './pages/Empresa';
import Articulo from './pages/Articulo';
import CategoriaArticulo from './pages/CategoriaArticulo';
import MarcaArticulo from './pages/MarcaArticulo';
import RegistrarVenta from './pages/RegistrarVenta';
import ConsultarVentaYDevoluciones from './pages/ConsultarVentaYDevoluciones';
import ConsultarCompraYDevoluciones from './pages/ConsultarCompraYDevoluciones';
import RegistrarCompra from './pages/RegistrarCompra';
import PuntoExpedicion from './pages/PuntoExpedicion';
import Stock from './pages/Stock';
import StockDetallado from './pages/StockDetallado';
import PuntoExpedicionUsuarios from './pages/PuntoExpedicionUsuarios';
import Timbrados from './pages/Timbrados';
import { CotizacionProvider } from './context/CotizacionContext';
import DevolucionCompra from './pages/DevolucionCompra';
import DevolucionVenta from './pages/DevolucionVenta';
import SeleccionarPuntoExp from './pages/SeleccionarPunto';
import Error from './pages/Error';
import PerfilUsuario from './pages/Perfil';

function App() {
  return (
    <Router>
      {/* 🔥 Provider debe estar aquí para poder usar useLocation dentro */}
      <CotizacionProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/seleccionarPuntoExp" element={<SeleccionarPuntoExp />} />

          {/* 🔥 Rutas protegidas con layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/perfil" element={<PerfilUsuario />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/error-permiso" element={<Error />} />
            {/* Cuentas */}
            <Route path="/cuenta/" element={<CuentasFinancieras />} />
            <Route path="/cuenta/informe/analitico" element={<AnaliticoCuenta />} />
            <Route path="/cuenta/informe/saldos" element={<SaldosCuentas />} />
            {/* Movimientos */}
            <Route path="/movimientos" element={<MovimientosFinancieros />} />
            <Route path="/movimientos/recibeValores" element={<RecibeValores />} />
            <Route path="/movimientos/pagaValores" element={<PagaValores />} />
            <Route path="/movimientos/informe/analitico-cobrar-pagar" element={<AnaliticoCobrarPagar />} />
            <Route path="/movimientos/informe/saldos-cobrar-pagar" element={<SaldosCobrarPagar />} />
            {/* Comercial */}
            <Route path="/comercial/ClientesProveedores/entidades" element={<Entidades />} />
            <Route path="/comercial/inventario/articulo" element={<Articulo />} />
            <Route path="/comercial/inventario/stock" element={<Stock />} />
            <Route path="/comercial/inventario/stockDetallado" element={<StockDetallado />} />
            <Route path="/comercial/inventario/articulo/categorias" element={<CategoriaArticulo />} />
            <Route path="/comercial/inventario/articulo/marcas" element={<MarcaArticulo />} />
            <Route path="/comercial/ventas/registrarVenta" element={<RegistrarVenta />} />
            <Route path="/comercial/ventas/devolucionVenta" element={<DevolucionVenta />} />
            <Route path="/comercial/ventas/consultar" element={<ConsultarVentaYDevoluciones />} />
            <Route path="/comercial/compras/registrarCompra" element={<RegistrarCompra />} />
            <Route path="/comercial/compras/devolucionCompra" element={<DevolucionCompra />} />
            <Route path="/comercial/compras/consultar" element={<ConsultarCompraYDevoluciones />} /> ///Actualizar
            {/* Cajas */}
            <Route path="/cajas/informe" element={<ListaCajas />} />
            <Route path="/cajas/registrar" element={<RegistrarCaja />} />
            <Route path="/cajas/informe/movimientos" element={<MovimientosCaja />} />
            {/* Ajustes */}
            <Route path="/ajustes/usuarios" element={<Usuarios />} />
            <Route path="/ajustes/contable/cotizaciones" element={<Cotizaciones />} />
            <Route path="/ajustes/contable/empresa" element={<Empresa />} />
            <Route path="/ajustes/contable/puntoExpedicion" element={<PuntoExpedicion />} />
            <Route path="/ajustes/contable/puntoExpedicion/usuarios" element={<PuntoExpedicionUsuarios />} />
            <Route path="/ajustes/contable/timbrados" element={<Timbrados />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </CotizacionProvider>
    </Router>
  );
}

export default App;