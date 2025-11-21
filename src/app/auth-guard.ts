import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './login/auth.service'; // Vérifiez que le chemin est bon

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }
  const user = authService.getUser();
  
  if (!user) {
    authService.logout();
    return router.createUrlTree(['/login']);
  }
  const loggedInUserId = user.idUtilisateur || user.id || user._id; 

  if (!loggedInUserId) {
    console.error("ERREUR CRITIQUE: Aucun ID trouvé (cherché idUtilisateur, id, _id)", user);
    authService.logout();
    return router.createUrlTree(['/login']);
  }
  const requestedId = route.paramMap.get('idp') || 
                      route.paramMap.get('idm') || 
                      route.paramMap.get('id');

  if (requestedId && requestedId !== String(loggedInUserId)) {
    if (user.role === 'patient') {
      return router.createUrlTree(['/dashboard', loggedInUserId, 'acc-dashboard']);
    } else if (user.role === 'medecin') {
      return router.createUrlTree(['/medecin', loggedInUserId, 'dashboard']);
    } else if (user.role === 'admin') {
      return router.createUrlTree(['/admin', loggedInUserId, 'admin-dashboard']);
    }
  }

  return true;
};
