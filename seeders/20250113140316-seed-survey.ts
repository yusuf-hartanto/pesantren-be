'use strict';

import { v4 as uuidv4 } from 'uuid';
import { datasurvey } from '../config/data/survey';
import Model from '../src/module/survey/event.model';
import { QueryInterface, Sequelize } from 'sequelize';
import ModelForm from '../src/module/survey/form.model';
import ModelFormAnswer from '../src/module/survey/form.answer.model';
import { repository as repoResource } from '../src/module/app/resource/resource.repository';

type Migration = (
  queryInterface: QueryInterface,
  sequelize: Sequelize
) => Promise<void>;
export const up: Migration = async () => {
  const formId: string = uuidv4();
  const events = datasurvey.event();
  const forms = datasurvey.form();
  const formAnswers = datasurvey.formanswer();
  const resource = await repoResource.detail({ username: 'adminuser' }, '');

  for (let i in events) {
    await Model.create({
      ...events[i],
      id: uuidv4(),
      form_id: formId,
      created_by: resource?.getDataValue('resource_id'),
    });
  }
  for (let n in forms) {
    const form = await ModelForm.create({
      ...forms[n],
      question_id: uuidv4(),
      form_id: formId,
      parent_id: '00000000-0000-0000-0000-000000000000',
      created_by: resource?.getDataValue('resource_id'),
    });
    const bulkInsert = formAnswers
      ?.filter((r) => r?.question_id == forms[n]?.nourut)
      ?.map((r) => {
        return {
          ...r,
          answer_id: uuidv4(),
          question_id: form?.dataValues?.question_id,
          created_by: resource?.getDataValue('resource_id'),
        };
      });
    await ModelFormAnswer.bulkCreate(bulkInsert);
  }
};

export const down: Migration = async () => {
  await Model.destroy({ where: {}, truncate: true });
};
