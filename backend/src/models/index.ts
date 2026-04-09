import { DataTypes, Model, Sequelize } from 'sequelize';

export interface UserAttributes {
  id?: number;
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface EventAttributes {
  id?: number;
  external_id?: string;
  name: string;
  description?: string;
  venue: string;
  date_time: Date;
  image_url?: string;
  status?: 'active' | 'cancelled' | 'completed';
  created_at?: Date;
  updated_at?: Date;
}

export interface ZoneAttributes {
  id?: number;
  event_id: number;
  zone_key: string;
  zone_name: string;
  price: number;
  color: string;
}

export interface SeatAttributes {
  id?: number;
  event_id: number;
  zone_id: number;
  row: string;
  seat_number: number;
  status?: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  reserved_by?: number;
  sold_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ReservationAttributes {
  id?: number;
  user_id: number;
  event_id: number;
  seat_id: number;
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  reserved_at?: Date;
  expires_at: Date;
  confirmed_at?: Date;
  completed_at?: Date;
}

export interface PurchaseAttributes {
  id?: number;
  user_id: number;
  event_id: number;
  total_price: number;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at?: Date;
  completed_at?: Date;
  updated_at?: Date;
}

export interface PurchaseItemAttributes {
  id?: number;
  purchase_id: number;
  seat_id: number;
  zone_name: string;
  price: number;
  created_at?: Date;
}

export function initializeModels(sequelize: Sequelize) {
  // User model
  class User extends Model<UserAttributes> implements UserAttributes {
    declare id: number;
    declare email: string;
    declare password_hash: string;
    declare full_name: string;
    declare phone?: string;
    declare created_at: Date;
    declare updated_at: Date;

    declare readonly reservations?: Reservation[];
    declare readonly purchases?: Purchase[];
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: DataTypes.STRING(255),
        unique: true,
        allowNull: false
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      full_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20)
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: false
    }
  );

  // Event model
  class Event extends Model<EventAttributes> implements EventAttributes {
    declare id: number;
    declare external_id?: string;
    declare name: string;
    declare description?: string;
    declare venue: string;
    declare date_time: Date;
    declare image_url?: string;
    declare status: 'active' | 'cancelled' | 'completed';
    declare created_at: Date;
    declare updated_at: Date;

    declare readonly zones?: Zone[];
    declare readonly seats?: Seat[];
  }

  Event.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      external_id: {
        type: DataTypes.STRING(255),
        unique: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT
      },
      venue: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      date_time: {
        type: DataTypes.DATE,
        allowNull: false
      },
      image_url: {
        type: DataTypes.STRING(500)
      },
      status: {
        type: DataTypes.ENUM('active', 'cancelled', 'completed'),
        defaultValue: 'active'
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'events',
      timestamps: false
    }
  );

  // Zone model
  class Zone extends Model<ZoneAttributes> implements ZoneAttributes {
    declare id: number;
    declare event_id: number;
    declare zone_key: string;
    declare zone_name: string;
    declare price: number;
    declare color: string;

    declare readonly event?: Event;
  }

  Zone.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      zone_key: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      zone_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: false
      }
    },
    {
      sequelize,
      tableName: 'zones',
      timestamps: false
    }
  );

  // Seat model
  class Seat extends Model<SeatAttributes> implements SeatAttributes {
    declare id: number;
    declare event_id: number;
    declare zone_id: number;
    declare row: string;
    declare seat_number: number;
    declare status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
    declare reserved_by?: number;
    declare sold_by?: number;
    declare created_at: Date;
    declare updated_at: Date;

    declare readonly zone?: Zone;
    declare readonly event?: Event;
    declare readonly reservation?: Reservation;
  }

  Seat.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      zone_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      row: {
        type: DataTypes.STRING(1),
        allowNull: false
      },
      seat_number: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('AVAILABLE', 'RESERVED', 'SOLD'),
        defaultValue: 'AVAILABLE'
      },
      reserved_by: {
        type: DataTypes.INTEGER
      },
      sold_by: {
        type: DataTypes.INTEGER
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'seats',
      timestamps: false,
      indexes: [
        { fields: ['event_id'] },
        { fields: ['status'] },
        { fields: ['reserved_by'] }
      ]
    }
  );

  // Reservation model
  class Reservation extends Model<ReservationAttributes> implements ReservationAttributes {
    declare id: number;
    declare user_id: number;
    declare event_id: number;
    declare seat_id: number;
    declare status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
    declare reserved_at: Date;
    declare expires_at: Date;
    declare confirmed_at?: Date;
    declare completed_at?: Date;

    declare readonly user?: User;
    declare readonly seat?: Seat;
    declare readonly event?: Event;
  }

  Reservation.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      seat_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'EXPIRED', 'CANCELLED'),
        defaultValue: 'PENDING'
      },
      reserved_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      confirmed_at: {
        type: DataTypes.DATE
      },
      completed_at: {
        type: DataTypes.DATE
      }
    },
    {
      sequelize,
      tableName: 'reservations',
      timestamps: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['event_id'] },
        { fields: ['status'] },
        { fields: ['expires_at'] }
      ]
    }
  );

  // Purchase model
  class Purchase extends Model<PurchaseAttributes> implements PurchaseAttributes {
    declare id: number;
    declare user_id: number;
    declare event_id: number;
    declare total_price: number;
    declare status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    declare first_name: string;
    declare last_name: string;
    declare email: string;
    declare phone?: string;
    declare created_at: Date;
    declare completed_at?: Date;
    declare updated_at: Date;

    declare readonly user?: User;
    declare readonly event?: Event;
    declare readonly items?: PurchaseItem[];
  }

  Purchase.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'),
        defaultValue: 'PENDING'
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(20)
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      completed_at: {
        type: DataTypes.DATE
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'purchases',
      timestamps: false,
      indexes: [
        { fields: ['user_id'] },
        { fields: ['event_id'] }
      ]
    }
  );

  // PurchaseItem model
  class PurchaseItem extends Model<PurchaseItemAttributes> implements PurchaseItemAttributes {
    declare id: number;
    declare purchase_id: number;
    declare seat_id: number;
    declare zone_name: string;
    declare price: number;
    declare created_at: Date;

    declare readonly purchase?: Purchase;
    declare readonly seat?: Seat;
  }

  PurchaseItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      purchase_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      seat_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      zone_name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      sequelize,
      tableName: 'purchase_items',
      timestamps: false
    }
  );

  // Associacions
  User.hasMany(Reservation, { foreignKey: 'user_id' });
  Reservation.belongsTo(User, { foreignKey: 'user_id' });

  User.hasMany(Purchase, { foreignKey: 'user_id' });
  Purchase.belongsTo(User, { foreignKey: 'user_id' });

  Event.hasMany(Zone, { foreignKey: 'event_id' });
  Zone.belongsTo(Event, { foreignKey: 'event_id' });

  Event.hasMany(Seat, { foreignKey: 'event_id' });
  Seat.belongsTo(Event, { foreignKey: 'event_id' });

  Event.hasMany(Reservation, { foreignKey: 'event_id' });
  Reservation.belongsTo(Event, { foreignKey: 'event_id' });

  Event.hasMany(Purchase, { foreignKey: 'event_id' });
  Purchase.belongsTo(Event, { foreignKey: 'event_id' });

  Zone.hasMany(Seat, { foreignKey: 'zone_id' });
  Seat.belongsTo(Zone, { foreignKey: 'zone_id' });

  Seat.hasMany(Reservation, { foreignKey: 'seat_id' });
  Reservation.belongsTo(Seat, { foreignKey: 'seat_id' });

  Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id' });
  PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchase_id' });

  PurchaseItem.belongsTo(Seat, { foreignKey: 'seat_id' });
  Seat.hasMany(PurchaseItem, { foreignKey: 'seat_id' });

  return {
    User,
    Event,
    Zone,
    Seat,
    Reservation,
    Purchase,
    PurchaseItem
  };
}
