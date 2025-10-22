import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoCreate } from './pago-create';

describe('PagoCreate', () => {
  let component: PagoCreate;
  let fixture: ComponentFixture<PagoCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
