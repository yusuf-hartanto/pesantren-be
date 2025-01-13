'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'policy_number',
      'provider_company',
      'product_name',
      'policy_holder',
      'insured_holder',
      'beneficiary_holder',
      'issued_date',
      'premi_currency',
      'premi_value',
      'payment_term',
      'payment_term_unit',
      'insured_term',
      'insured_term_unit',
      'due_date',
      'seller_name',
      'notes',
    ];
    return field;
  }
}

export const variable = new Variable();
