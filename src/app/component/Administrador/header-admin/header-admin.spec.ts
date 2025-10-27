import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderAdministradorComponent } from './header-admin';

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
});