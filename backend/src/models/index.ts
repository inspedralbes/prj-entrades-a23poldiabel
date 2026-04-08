import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '../config/database.js';

interface UsuariAttributes {
  id: string;
  correu_electronic: string;
  nom: string;
  rol: 'comprador' | 'administrador';
  contrasenya?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface UsuariCreationAttributes extends Optional<UsuariAttributes, 'id' | 'contrasenya'> {}

export class Usuari extends Model<UsuariAttributes, UsuariCreationAttributes> implements UsuariAttributes {
  declare id: string;
  declare correu_electronic: string;
  declare nom: string;
  declare rol: 'comprador' | 'administrador';
  declare contrasenya: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Usuari.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    correu_electronic: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    rol: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['comprador', 'administrador']],
      },
    },
    contrasenya: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'usuari',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

interface EsdevenimentAttributes {
  id: string;
  nom: string;
  data_hora: Date;
  recinte: string;
  descripcio?: string;
  imatge?: string;
  estat: 'actiu' | 'cancelat' | 'finalitzat';
  created_at?: Date;
  updated_at?: Date;
}

interface EsdevenimentCreationAttributes extends Optional<EsdevenimentAttributes, 'id' | 'descripcio' | 'estat' | 'imatge'> {}

export class Esdeveniment extends Model<EsdevenimentAttributes, EsdevenimentCreationAttributes> implements EsdevenimentAttributes {
  declare id: string;
  declare nom: string;
  declare data_hora: Date;
  declare recinte: string;
  declare descripcio: string;
  declare imatge: string;
  declare estat: 'actiu' | 'cancelat' | 'finalitzat';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Esdeveniment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    data_hora: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    recinte: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    descripcio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imatge: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    estat: {
      type: DataTypes.STRING(20),
      defaultValue: 'actiu',
      validate: {
        isIn: [['actiu', 'cancelat', 'finalitzat']],
      },
    },
  },
  {
    sequelize,
    tableName: 'esdeveniment',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

interface ZonaAttributes {
  id: string;
  esdeveniment_id: string;
  nom: string;
  preu: number;
  capacitat: number;
  created_at?: Date;
}

interface ZonaCreationAttributes extends Optional<ZonaAttributes, 'id'> {}

export class Zona extends Model<ZonaAttributes, ZonaCreationAttributes> implements ZonaAttributes {
  declare id: string;
  declare esdeveniment_id: string;
  declare nom: string;
  declare preu: number;
  declare capacitat: number;
  declare readonly created_at: Date;
}

Zona.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    esdeveniment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'esdeveniment',
        key: 'id',
      },
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    preu: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    capacitat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    tableName: 'zona',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

interface SeientAttributes {
  id: string;
  zona_id: string;
  numero: string;
  fila: string;
  estat: 'disponible' | 'reservat' | 'seleccionat' | 'venut';
  created_at?: Date;
  updated_at?: Date;
}

interface SeientCreationAttributes extends Optional<SeientAttributes, 'id' | 'estat'> {}

export class Seient extends Model<SeientAttributes, SeientCreationAttributes> implements SeientAttributes {
  declare id: string;
  declare zona_id: string;
  declare numero: string;
  declare fila: string;
  declare estat: 'disponible' | 'reservat' | 'seleccionat' | 'venut';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Seient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    zona_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'zona',
        key: 'id',
      },
    },
    numero: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    fila: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    estat: {
      type: DataTypes.STRING(20),
      defaultValue: 'disponible',
      validate: {
        isIn: [['disponible', 'reservat', 'seleccionat', 'venut']],
      },
    },
  },
  {
    sequelize,
    tableName: 'seient',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

interface ReservaAttributes {
  id: string;
  usuari_id?: string;
  esdeveniment_id: string;
  token: string;
  data_inici: Date;
  data_expiracio: Date;
  estat: 'activa' | 'expirada' | 'comprada' | 'cancelada';
  created_at?: Date;
  updated_at?: Date;
}

interface ReservaCreationAttributes extends Optional<ReservaAttributes, 'id' | 'usuari_id' | 'estat'> {}

export class Reserva extends Model<ReservaAttributes, ReservaCreationAttributes> implements ReservaAttributes {
  declare id: string;
  declare usuari_id: string;
  declare esdeveniment_id: string;
  declare token: string;
  declare data_inici: Date;
  declare data_expiracio: Date;
  declare estat: 'activa' | 'expirada' | 'comprada' | 'cancelada';
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

Reserva.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    usuari_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuari',
        key: 'id',
      },
    },
    esdeveniment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'esdeveniment',
        key: 'id',
      },
    },
    token: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    data_inici: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    data_expiracio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    estat: {
      type: DataTypes.STRING(20),
      defaultValue: 'activa',
      validate: {
        isIn: [['activa', 'expirada', 'comprada', 'cancelada']],
      },
    },
  },
  {
    sequelize,
    tableName: 'reserva',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

interface EntradaAttributes {
  id: string;
  reserva_id?: string;
  usuari_id?: string;
  esdeveniment_id: string;
  codi_entrada: string;
  data_compra: Date;
  created_at?: Date;
}

interface EntradaCreationAttributes extends Optional<EntradaAttributes, 'id' | 'reserva_id' | 'usuari_id'> {}

export class Entrada extends Model<EntradaAttributes, EntradaCreationAttributes> implements EntradaAttributes {
  declare id: string;
  declare reserva_id: string;
  declare usuari_id: string;
  declare esdeveniment_id: string;
  declare codi_entrada: string;
  declare data_compra: Date;
  declare readonly created_at: Date;
}

Entrada.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reserva_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'reserva',
        key: 'id',
      },
    },
    usuari_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'usuari',
        key: 'id',
      },
    },
    esdeveniment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'esdeveniment',
        key: 'id',
      },
    },
    codi_entrada: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    data_compra: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'entrada',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export class ReservaSeient extends Model {
  declare reserva_id: string;
  declare seient_id: string;
}

ReservaSeient.init({
  reserva_id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  seient_id: {
    type: DataTypes.UUID,
    primaryKey: true,
  }
}, { sequelize, tableName: 'reserva_seient', timestamps: false });

export class EntradaSeient extends Model {
  declare entrada_id: string;
  declare seient_id: string;
}

EntradaSeient.init({
  entrada_id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  seient_id: {
    type: DataTypes.UUID,
    primaryKey: true,
  }
}, { sequelize, tableName: 'entrada_seient', timestamps: false });

Esdeveniment.hasMany(Zona, { foreignKey: 'esdeveniment_id', as: 'zones' });
Zona.belongsTo(Esdeveniment, { foreignKey: 'esdeveniment_id', as: 'esdeveniment' });

Zona.hasMany(Seient, { foreignKey: 'zona_id', as: 'seients' });
Seient.belongsTo(Zona, { foreignKey: 'zona_id', as: 'zona' });

Esdeveniment.hasMany(Reserva, { foreignKey: 'esdeveniment_id', as: 'reserves' });
Reserva.belongsTo(Esdeveniment, { foreignKey: 'esdeveniment_id', as: 'esdeveniment' });

Usuari.hasMany(Reserva, { foreignKey: 'usuari_id', as: 'reserves' });
Reserva.belongsTo(Usuari, { foreignKey: 'usuari_id', as: 'usuari' });

Reserva.belongsToMany(Seient, { through: ReservaSeient, foreignKey: 'reserva_id', as: 'seients' });
Seient.belongsToMany(Reserva, { through: ReservaSeient, foreignKey: 'seient_id', as: 'reserves' });

Esdeveniment.hasMany(Entrada, { foreignKey: 'esdeveniment_id', as: 'entrades' });
Entrada.belongsTo(Esdeveniment, { foreignKey: 'esdeveniment_id', as: 'esdeveniment' });

Usuari.hasMany(Entrada, { foreignKey: 'usuari_id', as: 'entrades' });
Entrada.belongsTo(Usuari, { foreignKey: 'usuari_id', as: 'usuari' });

Entrada.belongsToMany(Seient, { through: EntradaSeient, foreignKey: 'entrada_id', as: 'seients' });
Seient.belongsToMany(Entrada, { through: EntradaSeient, foreignKey: 'seient_id', as: 'entrades' });

export { Op };
