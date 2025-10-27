// cliente-membresia.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClienteMembresiaComponent } from './cliente-membresia';

describe('ClienteMembresiaComponent', () => {
  let component: ClienteMembresiaComponent;
  let fixture: ComponentFixture<ClienteMembresiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ClienteMembresiaComponent] // ✅ aquí van los componentes
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteMembresiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
