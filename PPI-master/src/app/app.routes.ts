import { Routes } from '@angular/router';
import { Login } from './paginas/funcionalidades/autenticacion/login/login';
import { HomeComponent } from './paginas/home/home';
import { MainLayout } from './compartido/disenos/layout-principal/layout';
import { UsuarioLayout } from './compartido/disenos/layout-usuario/usuario-layout';
import { SplashComponent } from './paginas/splash/splash';
import { EditarEmpleado } from './paginas/funcionalidades/empleados/editar-empleado/editar-empleado';
import { RegistrarEmpleado } from './paginas/funcionalidades/empleados/registrar-empleado/registrar-empleado';
import { Calzado } from './paginas/funcionalidades/inventario/calzado/calzado';
import { Categorias } from './paginas/funcionalidades/inventario/categorias/categorias';
import { Proveedores } from './paginas/funcionalidades/prove/proveedores/proveedores';
import { CodigoRecuperacion } from './paginas/funcionalidades/autenticacion/codigo-recuperacion/codigo-recuperacion';
import { NuevaContrasena } from './paginas/funcionalidades/autenticacion/nueva-contrasena/nueva-contrasena';
import { MovimientoStock } from './paginas/movimiento-stock/movimiento-stock';
import { Perfil } from './paginas/perfil/perfil';
import { Facturacion } from './paginas/facturacion/facturacion';
import { adminGuard, usuarioGuard } from './nucleo/guardias/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas públicas sin layout
  { path: 'login', component: Login },
  { path: 'codigo-recuperacion', component: CodigoRecuperacion },
  { path: 'nueva-contrasena', component: NuevaContrasena },
  { path: 'splash', component: SplashComponent },

  // ────────────────────────────────────────────
  // RUTAS ADMIN — layout azul, acceso completo
  // ────────────────────────────────────────────
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'home', component: HomeComponent, canActivate: [adminGuard] },
      { path: 'editar-empleado', component: EditarEmpleado, canActivate: [adminGuard] },
      { path: 'registrar-empleado', component: RegistrarEmpleado, canActivate: [adminGuard] },
      { path: 'calzado', component: Calzado, canActivate: [adminGuard] },
      { path: 'categorias', component: Categorias, canActivate: [adminGuard] },
      { path: 'proveedores', component: Proveedores, canActivate: [adminGuard] },
      { path: 'movimiento-stock', component: MovimientoStock, canActivate: [adminGuard] },
      { path: 'facturacion', component: Facturacion, canActivate: [adminGuard] },
      { path: 'perfil', component: Perfil, canActivate: [adminGuard] }
    ]
  },

  // ────────────────────────────────────────────
  // RUTAS USUARIO — layout verde, solo lectura + entrada/salida
  // ────────────────────────────────────────────
  {
    path: 'usuario',
    component: UsuarioLayout,
    children: [
      { path: 'home', component: HomeComponent, canActivate: [usuarioGuard] },
      { path: 'calzado', component: Calzado, canActivate: [usuarioGuard] },
      { path: 'categorias', component: Categorias, canActivate: [usuarioGuard] },
      { path: 'proveedores', component: Proveedores, canActivate: [usuarioGuard] },
      { path: 'movimiento-stock', component: MovimientoStock, canActivate: [usuarioGuard] },
      { path: 'facturacion', component: Facturacion, canActivate: [usuarioGuard] },
      { path: 'perfil', component: Perfil, canActivate: [usuarioGuard] }
    ]
  },

  { path: '**', redirectTo: 'login' }
];

