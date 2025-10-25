import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HeaderInstructorComponent } from './header-instructor'; // ← Importa el Component

describe('HeaderInstructorComponent', () => { // ← Usa el nombre completo
  let component: HeaderInstructorComponent;
  let fixture: ComponentFixture<HeaderInstructorComponent>;
  let router: Router;

  beforeEach(async () => {
    const routerMock = {
      navigate: jasmine.createSpy('navigate'),
      url: '/actividades'
    };

    await TestBed.configureTestingModule({
      imports: [HeaderInstructorComponent],
      providers: [
        { provide: Router, useValue: routerMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderInstructorComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should logout and navigate to login', () => {
    spyOn(localStorage, 'removeItem');
    
    component.logout();

    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('userRole');
    expect(localStorage.removeItem).toHaveBeenCalledWith('userData');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should check if route is active', () => {
    expect(component.isRouteActive('actividades')).toBeTrue();
    expect(component.isRouteActive('rutinas')).toBeFalse();
  });
});