import { TestBed } from '@angular/core/testing';

import { ClienteMembresia } from './cliente-membresia';

describe('ClienteMembresia', () => {
  let service: ClienteMembresia;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClienteMembresia);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
