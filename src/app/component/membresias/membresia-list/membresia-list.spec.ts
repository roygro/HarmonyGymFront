import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MembresiaList } from './membresia-list';

describe('MembresiaList', () => {
  let component: MembresiaList;
  let fixture: ComponentFixture<MembresiaList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MembresiaList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MembresiaList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
