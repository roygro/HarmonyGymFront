import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderRecepcionista } from './header-recepcionista';

describe('HeaderRecepcionista', () => {
  let component: HeaderRecepcionista;
  let fixture: ComponentFixture<HeaderRecepcionista>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderRecepcionista]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderRecepcionista);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
