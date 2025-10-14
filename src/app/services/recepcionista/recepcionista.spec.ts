import { TestBed } from '@angular/core/testing';

import { Recepcionista } from './recepcionista';

describe('Recepcionista', () => {
  let service: Recepcionista;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Recepcionista);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
