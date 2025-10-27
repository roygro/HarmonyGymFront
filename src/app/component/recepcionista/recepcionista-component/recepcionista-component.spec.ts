import { ComponentFixture, TestBed } from '@angular/core/testing';


import { RecepcionistaComponent } from './recepcionista-component';
import { HeaderAdministradorComponent } from '../../Administrador/header-admin/header-admin';

describe('RecepcionistaComponent', () => {
  let component: RecepcionistaComponent;
  let fixture: ComponentFixture<RecepcionistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecepcionistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecepcionistaComponent);
  

describe('HeaderAdmin', () => {
  let component: HeaderAdministradorComponent;
  let fixture: ComponentFixture<HeaderAdministradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderAdministradorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderAdministradorComponent);

    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

})})});
