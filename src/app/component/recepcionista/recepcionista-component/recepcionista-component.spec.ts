import { ComponentFixture, TestBed } from '@angular/core/testing';

<<<<<<<< HEAD:src/app/component/recepcionista/recepcionista-component/recepcionista-component.spec.ts
import { RecepcionistaComponent } from './recepcionista-component';

describe('RecepcionistaComponent', () => {
  let component: RecepcionistaComponent;
  let fixture: ComponentFixture<RecepcionistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepcionistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecepcionistaComponent);
========
import { HeaderAdmin } from './header-admin';

describe('HeaderAdmin', () => {
  let component: HeaderAdmin;
  let fixture: ComponentFixture<HeaderAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderAdmin);
>>>>>>>> f056985985515725b9b9bde9eb50f6262bd07cfd:src/app/component/Administrador/header-admin/header-admin.spec.ts
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
