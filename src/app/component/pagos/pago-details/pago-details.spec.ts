import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoDetails } from './pago-details';

describe('PagoDetails', () => {
  let component: PagoDetails;
  let fixture: ComponentFixture<PagoDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
