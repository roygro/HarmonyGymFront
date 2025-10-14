import { TestBed } from '@angular/core/testing';

import { Instructor } from './instructor';

describe('Instructor', () => {
  let service: Instructor;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Instructor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
