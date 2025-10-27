import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteMembresia } from './cliente-membresia';

describe('ClienteMembresia', () => {
  let component: ClienteMembresia;
  let fixture: ComponentFixture<ClienteMembresia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteMembresia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteMembresia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
