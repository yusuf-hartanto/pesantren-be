'use strict';

export default class Variable {
  public event() {
    const field: Array<string> = [
      'form_id',
      'event',
      'desc',
      'start_period',
      'end_period',
      'is_active',
      'is_random',
    ];
    return field;
  }

  public form() {
    const field: Array<string> = [
      'form_id',
      'question',
      'parent_id',
      'type',
      'nourut',
      'url_image2',
      'is_active',
    ];
    return field;
  }

  public formanswer() {
    const field: Array<string> = [
      'question_id',
      'text_answer',
      'alert_answer',
      'nourut',
    ];
    return field;
  }

  public formanswervalue() {
    const field: Array<string> = [
      'client_id',
      'event_id',
      'form_id',
      'question_id',
      'question',
      'text_answer',
    ];
    return field;
  }
}

export const variable = new Variable();
