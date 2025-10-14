import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Recepcionista } from './recepcionista';

describe('Recepcionista', () => {
  let component: Recepcionista;
  let fixture: ComponentFixture<Recepcionista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recepcionista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Recepcionista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
