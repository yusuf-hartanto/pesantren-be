'use strict';

import { Op, Sequelize } from 'sequelize';
import Model, { OrganitationUnit } from './organitation.unit.model';
import Cabang from '../cabang/cabang.model';
import LembagaPendidikan from '../lembaga.pendidikan/lembaga.pendidikan.model';

export default class Repository {
	public list(data: any) {
		let query: Object = {
			order: [['id_orgunit', 'DESC']],
			include: [
				{
					model: OrganitationUnit,
					as: 'parent',
					attributes: ['id_orgunit', 'nama_orgunit'],
					required: false,
				},
				{
					model: Cabang,
					as: 'cabang',
					attributes: ['id_cabang', 'nama_cabang'],
					required: false,
				},
				{
					model: LembagaPendidikan,
					as: 'lembaga_pendidikan',
					attributes: ['id_cabang', 'nama_lembaga'],
					required: false,
				},
			],
		};

		const keyword = data?.keyword ? `%${data.keyword}%` : null;

		if (keyword) {
			query = {
				...query,
				where: {
					nama_orgunit: { [Op.like]: keyword },
				},
			};
		}

		return Model.findAll(query);
	}

	public async index(data: any) {
		let query: Object = {
			order: [['id_orgunit', 'DESC']],
			offset: data?.offset,
			limit: data?.limit,
			distinct: true,
			subQuery: false,
			include: [
				{
					model: OrganitationUnit,
					as: 'parent',
					attributes: ['id_orgunit', 'nama_orgunit'],
					required: false,
				},
				{
					model: Cabang,
					as: 'cabang',
					attributes: ['id_cabang', 'nama_cabang'],
					required: false,
				},
				{
					model: LembagaPendidikan,
					as: 'lembaga_pendidikan',
					attributes: ['id_cabang', 'nama_lembaga'],
					required: false,
				},
			],
		};

		const keyword = data?.keyword ? `%${data.keyword}%` : null;

		if (keyword) {
			query = {
				...query,
				where: {
					[Op.or]: [
						{ id_orgunit: { [Op.like]: keyword } },
						{ nama_orgunit: { [Op.like]: keyword } },
						{ level_orgunit: { [Op.like]: keyword } },
						{ jenis_orgunit: { [Op.like]: keyword } },
						{ keterangan: { [Op.like]: keyword } },
						{ '$parent.nama_orgunit$': { [Op.like]: keyword } },
						{ '$cabang.nama_cabang$': { [Op.like]: keyword } },
						{ '$lembaga_pendidikan.nama_lembaga$': { [Op.like]: keyword } }
						
					]
				}
			}


			return await Model.findAndCountAll(query);
		}

		return Model.findAndCountAll(query);
	}


	public detail(condition: any) {
		return Model.findOne({
			include: [
				{
					model: OrganitationUnit,
					as: 'parent',
					attributes: ['id_orgunit', 'nama_orgunit'],
					required: false,
				},
				{
					model: Cabang,
					as: 'cabang',
					attributes: ['id_cabang', 'nama_cabang'],
					required: false,
				},
				{
					model: LembagaPendidikan,
					as: 'lembaga_pendidikan',
					attributes: ['id_cabang', 'nama_lembaga'],
					required: false,
				},
			],
			where: {
				...condition,
			},
		});
	}

	public async create(data: any) {
		return Model.bulkCreate(data.payload);
	}

	public update(data: any) {
		return Model.update(data?.payload, {
			where: data?.condition,
		});
	}

	public delete(data: any) {
		return Model.destroy({
			where: data?.condition,
		});
	}
}

export const repository = new Repository();
