import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembresiaForm } from './membresia-form';

describe('MembresiaForm', () => {
  let component: MembresiaForm;
  let fixture: ComponentFixture<MembresiaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembresiaForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembresiaForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
