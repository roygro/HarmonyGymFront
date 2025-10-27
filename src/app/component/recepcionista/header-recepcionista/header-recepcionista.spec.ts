import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderRecepcionistaComponent } from './header-recepcionista';

describe('HeaderRecepcionista', () => {
  let component: HeaderRecepcionistaComponent;
  let fixture: ComponentFixture<HeaderRecepcionistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderRecepcionistaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderRecepcionistaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});