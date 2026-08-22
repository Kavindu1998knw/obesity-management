import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Obesity Management System API',
    version: '1.0.0',
    description: `
## Comprehensive Clinical & Administrative API Documentation

The **Obesity Management System** is a full-stack clinical decision support and patient management platform with integrated Machine Learning (Random Forest) for obesity risk stratification and automated personalized Sri Lankan meal plan generation.

### Key Capabilities:
- **Authentication & RBAC**: JWT-based authentication supporting \`admin\`, \`doctor\`, and \`patient\` roles.
- **Machine Learning**: 17-feature Random Forest prediction pipeline classifying patients into 7 WHO obesity categories.
- **Dietary & Meal Planning**: Mifflin-St Jeor equation BMR/TDEE calculations, macronutrient breakdown, and automated meal curation with allergen/dislike filtering.
- **Clinical Workflow**: Appointment scheduling, doctor consultation notes, patient progress monitoring (BMI & weight tracking), and PDF-ready clinical report generation.

### Authentication Instructions:
1. Use \`POST /api/auth/login\` with your credentials to obtain a JWT token.
2. Click the **Authorize** button (top right) or padlock on any endpoint.
3. Paste the token into the **Value** field in the format: \`<your_jwt_token>\` (do not type \`Bearer \`, Swagger adds it automatically).
4. Click **Authorize** and test any secured endpoints.
    `,
    contact: {
      name: 'Obesity Management System Support',
      email: 'support@obesitymanagement.local'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  tags: [
    { name: 'Health Check', description: 'System health check and status' },
    { name: 'Authentication', description: 'User registration, login, and password management' },
    { name: 'Dashboard', description: 'Role-specific statistical overview and operational analytics' },
    { name: 'Admin - Doctor Management', description: 'Administrative CRUD operations and lifecycle management for doctors' },
    { name: 'Admin - Patient Management', description: 'Patient directory, doctor assignment, status toggling, and data deletion' },
    { name: 'Admin - Appointment Management', description: 'Global appointment approval, rejection, cancellation, and rescheduling' },
    { name: 'Admin - Reports', description: 'System-wide analytics and audit reports generation' },
    { name: 'Doctor - Patients', description: 'Assigned patient records, clinical notes, and lifestyle health parameters' },
    { name: 'Doctor - Appointments', description: 'Doctor schedule view and consultation completion workflow' },
    { name: 'Doctor - Obesity Assessments (ML)', description: 'Machine learning prediction inference, risk classification, and assessment saving' },
    { name: 'Doctor - Meal Plans', description: 'Nutritional calculation (BMR/TDEE), automated meal selection, draft editing, and clinical approval' },
    { name: 'Doctor - Reports', description: 'Clinical patient health, progress, and dietary reporting' },
    { name: 'Patient - Appointments', description: 'Appointment requests and cancellation management' },
    { name: 'Patient - Assessments', description: 'Historical obesity risk assessment reviews' },
    { name: 'Patient - Meal Plans', description: 'Approved personalized dietary plans and daily meal guidelines' },
    { name: 'Patient - Progress Tracking', description: 'Self-reported weight, BMI log, and dietary adherence history' },
    { name: 'Patient - Reports', description: 'Personal health and progress summaries' }
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health Check'],
        summary: 'Root server health check',
        description: 'Returns server operational status. Accessible without authentication.',
        responses: {
          200: {
            description: 'Server is running normally',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Server is running' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // =========================================================================
    // AUTHENTICATION
    // =========================================================================
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Patient self-registration',
        description: 'Creates a new user account with role `patient` and initializes their patient profile document. Role cannot be set to doctor or admin via this endpoint.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Account created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Validation failed (e.g. email already registered, weak password, future DOB, invalid gender)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal server or profile initialization error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticates any user (patient, doctor, or admin) using email and password. Returns a signed JWT token valid for 7 days.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          400: {
            description: 'Missing email or password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: {
            description: 'Invalid email or password',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          403: {
            description: 'Account has been deactivated by an administrator',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/reset-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Reset password using token',
        description: 'Allows a user to set a new password using a secure single-use token sent via email. Validates token authenticity and 48-hour expiration.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ResetPasswordRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Password changed successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: {
            description: 'Invalid/expired token or password under 8 characters',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          500: {
            description: 'Internal server error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },

    // =========================================================================
    // DASHBOARD
    // =========================================================================
    '/api/dashboard/admin': {
      get: {
        tags: ['Dashboard'],
        summary: 'Admin dashboard metrics & analytics',
        description: 'Returns aggregate metrics: doctor count, patient count, appointment status distribution, obesity classification breakdown, monthly appointment trends, and recent registrations.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Admin dashboard analytics data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AdminDashboardResponse' }
              }
            }
          },
          401: { description: 'Unauthorized – Missing or invalid JWT' },
          403: { description: 'Forbidden – Requires admin role' }
        }
      }
    },
    '/api/dashboard/doctor': {
      get: {
        tags: ['Dashboard'],
        summary: 'Doctor dashboard overview & schedule',
        description: 'Returns clinical overview for the logged-in doctor: assigned patients count, today\'s appointments, completed assessments, patients awaiting assessment, high-risk patients count, approved meal plans count, and recent predictions.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Doctor dashboard metrics data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DoctorDashboardResponse' }
              }
            }
          },
          401: { description: 'Unauthorized – Missing or invalid JWT' },
          403: { description: 'Forbidden – Requires doctor role' }
        }
      }
    },
    '/api/dashboard/patient': {
      get: {
        tags: ['Dashboard'],
        summary: 'Patient dashboard personal overview',
        description: 'Returns personal metrics for the logged-in patient: current BMI, latest obesity classification, current weight, weight change, next scheduled appointment, latest assessment result, approved meal plan, weight timeline, and dynamic notification updates.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Patient personal dashboard data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PatientDashboardResponse' }
              }
            }
          },
          401: { description: 'Unauthorized – Missing or invalid JWT' },
          403: { description: 'Forbidden – Requires patient role' }
        }
      }
    },

    // =========================================================================
    // ADMIN - DOCTOR MANAGEMENT
    // =========================================================================
    '/api/admin/doctors': {
      get: {
        tags: ['Admin - Doctor Management'],
        summary: 'List all doctors',
        description: 'Retrieves all doctor accounts along with aggregated statistics including assigned patient counts and appointment totals.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of doctors with profile and statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer', example: 5 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DoctorWithStats' }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden – Admin only' }
        }
      },
      post: {
        tags: ['Admin - Doctor Management'],
        summary: 'Create a new doctor account',
        description: 'Creates a doctor user account and linked Doctor profile, generates a secure password setup token, and dispatches a welcome email with login credentials.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateDoctorRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Doctor account created and credentials dispatched',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: { description: 'Validation failed – Missing required fields or invalid phone format' },
          409: { description: 'User with this email already exists' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/admin/doctors/{id}': {
      get: {
        tags: ['Admin - Doctor Management'],
        summary: 'Get doctor details by ID',
        description: 'Retrieves profile, specialisation, qualifications, and live appointment counts for a specific doctor.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Doctor User ID (MongoDB ObjectId)',
            schema: { type: 'string', example: '6650a1b2c3d4e5f678901234' }
          }
        ],
        responses: {
          200: {
            description: 'Doctor details retrieved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DoctorDetail' }
                  }
                }
              }
            }
          },
          404: { description: 'Doctor not found' }
        }
      },
      put: {
        tags: ['Admin - Doctor Management'],
        summary: 'Update doctor account & profile',
        description: 'Updates full name, email, phone number, specialisation, qualification, status, and optionally resets the password.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Doctor User ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateDoctorRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Doctor updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid email, phone format, or password length' },
          404: { description: 'Doctor not found' },
          409: { description: 'Email already in use by another user' }
        }
      },
      delete: {
        tags: ['Admin - Doctor Management'],
        summary: 'Delete doctor account',
        description: 'Permanently deletes a doctor user and profile, provided no active appointments, assessments, or meal plans depend on them.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Doctor User ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Doctor deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: { description: 'Cannot delete doctor with existing patient records or appointments' },
          404: { description: 'Doctor not found' }
        }
      }
    },
    '/api/admin/doctors/{id}/status': {
      patch: {
        tags: ['Admin - Doctor Management'],
        summary: 'Toggle doctor active/inactive status',
        description: 'Switches doctor account status between `active` and `inactive`. Inactive doctors cannot log in.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Doctor User ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Doctor status toggled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Doctor status changed to inactive' },
                    data: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'inactive'] }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: 'Doctor not found' }
        }
      }
    },

    // =========================================================================
    // ADMIN - PATIENT MANAGEMENT
    // =========================================================================
    '/api/admin/patients': {
      get: {
        tags: ['Admin - Patient Management'],
        summary: 'List all patients',
        description: 'Retrieves all registered patient accounts with linked profile information and assigned doctor details.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PatientListItem' }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/admin/patients/{id}': {
      get: {
        tags: ['Admin - Patient Management'],
        summary: 'Get complete patient record by ID',
        description: 'Retrieves full patient details including assigned doctor, health parameters, past appointments, assessments, and meal plans.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID or Patient Profile ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Full patient profile retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PatientDetail' }
                  }
                }
              }
            }
          },
          404: { description: 'Patient not found' }
        }
      },
      delete: {
        tags: ['Admin - Patient Management'],
        summary: 'Delete patient and associated clinical records',
        description: 'Executes a database transaction to delete a patient user account, profile, appointments, assessments, meal plans, progress logs, and clinical notes atomically.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Patient and all linked clinical records deleted successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          404: { description: 'Patient not found' }
        }
      }
    },
    '/api/admin/patients/{id}/status': {
      patch: {
        tags: ['Admin - Patient Management'],
        summary: 'Toggle patient active/inactive status',
        description: 'Toggles patient account status between `active` and `inactive`. Deactivated patients are blocked from logging in.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Patient status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: {
                      type: 'object',
                      properties: {
                        _id: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'inactive'] }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: 'Patient not found' }
        }
      }
    },
    '/api/admin/patients/{id}/assign-doctor': {
      patch: {
        tags: ['Admin - Patient Management'],
        summary: 'Assign or reassign doctor to patient',
        description: 'Assigns a designated doctor to a patient profile or unassigns them if null is passed.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AssignDoctorRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Doctor assigned successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          400: { description: 'Invalid doctor ID or specified doctor is not active' },
          404: { description: 'Patient not found' }
        }
      }
    },

    // =========================================================================
    // ADMIN - APPOINTMENT MANAGEMENT
    // =========================================================================
    '/api/admin/appointments': {
      get: {
        tags: ['Admin - Appointment Management'],
        summary: 'List all system appointments',
        description: 'Retrieves all appointments across the system with optional status filtering and populated patient/doctor names.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            description: 'Filter by appointment status',
            schema: { type: 'string', enum: ['pending', 'approved', 'completed', 'cancelled', 'rejected'] }
          }
        ],
        responses: {
          200: {
            description: 'List of appointments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'integer' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Appointment' }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/admin/appointments/{id}/status': {
      patch: {
        tags: ['Admin - Appointment Management'],
        summary: 'Approve, reject, or cancel appointment',
        description: 'Updates appointment status. Approving validates against double-booking and past dates. Rejecting or cancelling requires an explanation reason. Approving an appointment automatically assigns the doctor to the patient if currently unassigned.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Appointment ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateAppointmentStatusRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Appointment status updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Appointment' }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid state transition, missing rejection/cancellation reason, or past date' },
          409: { description: 'Doctor or patient already has an approved appointment at this date/time' },
          404: { description: 'Appointment not found' }
        }
      }
    },
    '/api/admin/appointments/{id}/reschedule': {
      put: {
        tags: ['Admin - Appointment Management'],
        summary: 'Reschedule an appointment',
        description: 'Changes the date, time, and optionally the doctor for a pending or approved appointment. Validates future date and double-booking constraints.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Appointment ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RescheduleAppointmentRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Appointment rescheduled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Appointment' }
                  }
                }
              }
            }
          },
          400: { description: 'Missing required fields, past date, or completed/cancelled status' },
          409: { description: 'Doctor or patient has a scheduling conflict at the new slot' },
          404: { description: 'Appointment not found' }
        }
      }
    },

    // =========================================================================
    // ADMIN - REPORTS
    // =========================================================================
    '/api/admin/reports/generate': {
      post: {
        tags: ['Admin - Reports'],
        summary: 'Generate admin system reports',
        description: 'Generates tabular reporting data across patients, doctors, appointments, obesity classifications, or patient weight progress with optional date range filtering.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AdminReportRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Report data generated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    reportType: { type: 'string' },
                    generatedAt: { type: 'string', format: 'date-time' },
                    data: { type: 'array', items: { type: 'object' } }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid report type specified' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' }
        }
      }
    },

    // =========================================================================
    // DOCTOR - PATIENTS
    // =========================================================================
    '/api/doctor/patients': {
      get: {
        tags: ['Doctor - Patients'],
        summary: 'List assigned patients',
        description: 'Retrieves all patients currently assigned to the logged-in doctor, including latest BMI, weight, and assessment summary.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of assigned patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/PatientDetail' }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden – Doctor only' }
        }
      }
    },
    '/api/doctor/patients/{id}': {
      get: {
        tags: ['Doctor - Patients'],
        summary: 'Get assigned patient profile & history',
        description: 'Retrieves full details for a patient assigned to the doctor, including health parameters, clinical notes, past assessments, and meal plans.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID or Profile ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Patient record details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/PatientDetail' }
                  }
                }
              }
            }
          },
          403: { description: 'Patient is not assigned to this doctor' },
          404: { description: 'Patient not found' }
        }
      }
    },
    '/api/doctor/patients/{id}/health-details': {
      put: {
        tags: ['Doctor - Patients'],
        summary: 'Update patient health details & lifestyle habits',
        description: 'Updates clinical lifestyle parameters (vegetable intake, physical activity, alcohol, smoking, water, dietary preferences, allergies, medical conditions) for an assigned patient.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID or Profile ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateHealthDetailsRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Health details updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/HealthDetails' }
                  }
                }
              }
            }
          },
          400: { description: 'Validation failed on health detail parameters' },
          403: { description: 'Patient not assigned to this doctor' },
          404: { description: 'Patient profile not found' }
        }
      }
    },
    '/api/doctor/patients/{id}/notes': {
      post: {
        tags: ['Doctor - Patients'],
        summary: 'Add a clinical note for patient',
        description: 'Creates a timestamped doctor note for an assigned patient (max 5000 characters).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID or Profile ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddDoctorNoteRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Clinical note added successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/DoctorNote' }
                  }
                }
              }
            }
          },
          400: { description: 'Note text required or exceeds character limit' },
          403: { description: 'Patient not assigned to this doctor' }
        }
      }
    },
    '/api/doctor/patients/{id}/notes/{noteId}': {
      put: {
        tags: ['Doctor - Patients'],
        summary: 'Update own clinical note',
        description: 'Edits the content of an existing clinical note authored by the logged-in doctor.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Patient User ID or Profile ID',
            schema: { type: 'string' }
          },
          {
            name: 'noteId',
            in: 'path',
            required: true,
            description: 'Doctor Note ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateDoctorNoteRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Clinical note updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/DoctorNote' }
                  }
                }
              }
            }
          },
          403: { description: 'Unauthorized to edit notes created by another doctor' },
          404: { description: 'Note not found' }
        }
      }
    },

    // =========================================================================
    // DOCTOR - APPOINTMENTS
    // =========================================================================
    '/api/doctor/appointments': {
      get: {
        tags: ['Doctor - Appointments'],
        summary: 'List doctor\'s appointments',
        description: 'Retrieves all approved, completed, and cancelled appointments for the logged-in doctor.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Doctor\'s appointment schedule',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Appointment' }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/doctor/appointments/{id}/complete': {
      put: {
        tags: ['Doctor - Appointments'],
        summary: 'Complete appointment with consultation notes',
        description: 'Marks an approved appointment as completed, records doctor consultation notes, and optionally flags follow-up requirements and suggested dates.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Appointment ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompleteAppointmentRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Appointment marked as completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Appointment' }
                  }
                }
              }
            }
          },
          400: { description: 'Appointment is not in approved state or missing consultation note' },
          403: { description: 'Appointment does not belong to this doctor' },
          404: { description: 'Appointment not found' }
        }
      }
    },

    // =========================================================================
    // DOCTOR - OBESITY ASSESSMENTS (ML)
    // =========================================================================
    '/api/doctor/assessments': {
      get: {
        tags: ['Doctor - Obesity Assessments (ML)'],
        summary: 'List assessments conducted by doctor',
        description: 'Retrieves all historical obesity risk assessments created by the logged-in doctor, with optional filtering by patientId.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'patientId',
            in: 'query',
            required: false,
            description: 'Filter assessments for a specific patient User ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'List of assessments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Assessment' }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' }
        }
      }
    },
    '/api/doctor/assessments/{id}': {
      get: {
        tags: ['Doctor - Obesity Assessments (ML)'],
        summary: 'Get assessment by ID',
        description: 'Retrieves complete input parameters, ML probabilities, confidence score, and obesity class for a specific assessment.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Assessment ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Assessment details retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Assessment' }
                  }
                }
              }
            }
          },
          404: { description: 'Assessment not found or unauthorized' }
        }
      }
    },
    '/api/doctor/assessments/predict': {
      post: {
        tags: ['Doctor - Obesity Assessments (ML)'],
        summary: 'Preview ML obesity prediction (without saving)',
        description: 'Calculates Physical_Activity_Score (FAF - TUE) and BMI, formats the 17-feature vector, calls the Python Flask ML Service (/predict), and returns the classified category and top probability rankings for doctor review.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PredictObesityRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Prediction preview generated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PredictionResponse' }
              }
            }
          },
          400: { description: 'Missing required basic measurements (Age, Gender, Height, Weight)' },
          403: { description: 'Patient is not assigned to this doctor and has no approved appointment' },
          503: { description: 'ML Prediction Service is unavailable' }
        }
      }
    },
    '/api/doctor/assessments/save': {
      post: {
        tags: ['Doctor - Obesity Assessments (ML)'],
        summary: 'Save verified assessment & update patient health profile',
        description: 'Re-computes BMI and re-calls the ML service server-side (preventing frontend spoofing), creates an Assessment record, updates the Patient profile with latest BMI, height, and weight, and synchronizes all lifestyle and dietary parameters to healthDetails.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaveAssessmentRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Assessment saved and patient health details synchronized',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Assessment saved successfully.' },
                    data: { $ref: '#/components/schemas/Assessment' }
                  }
                }
              }
            }
          },
          400: { description: 'Incomplete assessment data' },
          403: { description: 'Patient not assigned to this doctor' },
          503: { description: 'ML Service unavailable during save' }
        }
      }
    },

    // =========================================================================
    // DOCTOR - MEAL PLANS
    // =========================================================================
    '/api/doctor/meal-plans': {
      get: {
        tags: ['Doctor - Meal Plans'],
        summary: 'List doctor\'s meal plans',
        description: 'Retrieves meal plans created by the logged-in doctor with optional filtering by status (Draft/Approved), obesityClass, or patientId.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['Draft', 'Approved'] }
          },
          {
            name: 'obesityClass',
            in: 'query',
            required: false,
            schema: { type: 'string' }
          },
          {
            name: 'patientId',
            in: 'query',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'List of meal plans',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MealPlan' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Doctor - Meal Plans'],
        summary: 'Save a new meal plan draft',
        description: 'Computes BMR/TDEE targets server-side from assessment, fetches selected template snapshots, aggregates nutritional totals, and saves as Draft.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SaveMealPlanDraftRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Meal plan draft saved successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealPlan' }
                  }
                }
              }
            }
          },
          400: { description: 'Missing required assessment ID or template IDs, or invalid template' },
          403: { description: 'Patient not assigned to this doctor' }
        }
      }
    },
    '/api/doctor/meal-plans/generate': {
      post: {
        tags: ['Doctor - Meal Plans'],
        summary: 'Auto-generate suggested meal plan payload',
        description: 'Calculates Mifflin-St Jeor BMR, TDEE, and daily target, allocates calories (25% Breakfast, 35% Lunch, 30% Dinner, 10% Snack), filters active Sri Lankan meal templates by suitability, dietary preference, allergens, and dislikes, selects the closest calorie matches, and returns alternative options per category.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GenerateMealPlanRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Suggested meal plan payload generated with alternatives',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/GeneratedMealPlanPayload' }
                  }
                }
              }
            }
          },
          400: { description: 'Assessment missing demographic inputs or obesity class' },
          404: { description: 'Assessment not found' }
        }
      }
    },
    '/api/doctor/meal-plans/alternatives': {
      post: {
        tags: ['Doctor - Meal Plans'],
        summary: 'Get alternative meal options for a meal type',
        description: 'Returns available Sri Lankan meal templates matching the patient\'s obesity class and dietary requirements for swapping during plan curation.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AlternativeMealsRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Alternative meal templates list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MealSnapshot' }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Requires assessmentId or mealPlanId and mealType' }
        }
      }
    },
    '/api/doctor/meal-plans/{id}': {
      get: {
        tags: ['Doctor - Meal Plans'],
        summary: 'Get meal plan by ID with alternatives',
        description: 'Retrieves a meal plan along with categorized alternative meal options for interactive doctor editing.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Meal Plan ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Meal plan details with alternatives',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealPlan' }
                  }
                }
              }
            }
          },
          404: { description: 'Meal plan not found' }
        }
      },
      put: {
        tags: ['Doctor - Meal Plans'],
        summary: 'Update an existing draft meal plan',
        description: 'Updates meal templates, daily calorie target, foods to avoid, exercise recommendation, doctor instructions, and nutritional totals for a Draft meal plan.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Meal Plan ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateMealPlanDraftRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Meal plan draft updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealPlan' }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid template selection or calculations error' },
          404: { description: 'Draft not found or already approved' }
        }
      }
    },
    '/api/doctor/meal-plans/{id}/approve': {
      post: {
        tags: ['Doctor - Meal Plans'],
        summary: 'Approve meal plan & auto-complete appointment',
        description: 'Validates meal structure (exactly 1 Breakfast, 1 Lunch, 1 Dinner, 1-2 Snacks), enforces suitability, dietary, and allergen checks, requires doctor instructions and medical condition acknowledgment, transitions status to Approved, and automatically marks related approved appointments as completed.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Meal Plan ID',
            schema: { type: 'string' }
          }
        ],
        responses: {
          200: {
            description: 'Meal plan approved and consultation completed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/MealPlan' }
                  }
                }
              }
            }
          },
          400: { description: 'Missing doctor instructions, unacknowledged medical warning, invalid meal configuration, or allergen conflict' },
          404: { description: 'Draft not found or already approved' }
        }
      }
    },

    // =========================================================================
    // DOCTOR - REPORTS
    // =========================================================================
    '/api/doctor/reports/patients': {
      get: {
        tags: ['Doctor - Reports'],
        summary: 'Get assigned patients dropdown list for reports',
        description: 'Retrieves patient ID, name, email, and registration date for populating report generator selectors.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of assigned patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          fullName: { type: 'string' },
                          email: { type: 'string' },
                          createdAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/doctor/reports/generate': {
      get: {
        tags: ['Doctor - Reports'],
        summary: 'Generate clinical report for a patient',
        description: 'Generates structured report data for Patient Health Report, Obesity Assessment Report, Meal Plan Report, or Patient Progress Report.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'patientId',
            in: 'query',
            required: true,
            description: 'Patient User ID',
            schema: { type: 'string' }
          },
          {
            name: 'reportType',
            in: 'query',
            required: true,
            description: 'Type of clinical report',
            schema: {
              type: 'string',
              enum: ['Patient Health Report', 'Obesity Assessment Report', 'Meal Plan Report', 'Patient Progress Report']
            }
          }
        ],
        responses: {
          200: {
            description: 'Clinical report data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          400: { description: 'Missing patientId or invalid reportType' },
          403: { description: 'Patient is not assigned to this doctor' },
          404: { description: 'Patient not found' }
        }
      }
    },

    // =========================================================================
    // PATIENT - APPOINTMENTS
    // =========================================================================
    '/api/patient/appointments': {
      get: {
        tags: ['Patient - Appointments'],
        summary: 'Get patient\'s appointment history',
        description: 'Retrieves all appointments requested by the logged-in patient with doctor details and status.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Patient appointments list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Appointment' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Patient - Appointments'],
        summary: 'Request a new doctor appointment',
        description: 'Submits a new appointment request. Validates date format (YYYY-MM-DD), time format (HH:mm), ensures date is strictly in the future, verifies doctor is active, and prevents duplicate requests on the same day.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RequestAppointmentRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Appointment requested successfully (status: pending)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Appointment' }
                  }
                }
              }
            }
          },
          400: { description: 'Missing fields, invalid date/time format, past date, or doctor inactive' },
          409: { description: 'Patient already has an active appointment on this date' }
        }
      }
    },
    '/api/patient/appointments/doctors': {
      get: {
        tags: ['Patient - Appointments'],
        summary: 'List active doctors for booking',
        description: 'Retrieves active doctors with specialisation and qualifications for appointment booking dropdowns.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Active doctors list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DoctorListItem' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/patient/appointments/{id}/cancel': {
      put: {
        tags: ['Patient - Appointments'],
        summary: 'Cancel own appointment',
        description: 'Allows a patient to cancel their own pending or approved appointment with an optional reason note.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Appointment ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  cancellationReason: { type: 'string', example: 'Schedule conflict with work' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Appointment cancelled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/Appointment' }
                  }
                }
              }
            }
          },
          400: { description: 'Cannot cancel completed or already cancelled appointment' },
          403: { description: 'Appointment does not belong to this patient' },
          404: { description: 'Appointment not found' }
        }
      }
    },

    // =========================================================================
    // PATIENT - ASSESSMENTS
    // =========================================================================
    '/api/patient/assessments': {
      get: {
        tags: ['Patient - Assessments'],
        summary: 'Get patient\'s obesity assessment history',
        description: 'Retrieves all historical assessments conducted for the logged-in patient with doctor information, BMI, and classified obesity category.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'List of patient assessments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Assessment' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // =========================================================================
    // PATIENT - MEAL PLANS
    // =========================================================================
    '/api/patient/meal-plans': {
      get: {
        tags: ['Patient - Meal Plans'],
        summary: 'Get patient\'s approved meal plans',
        description: 'Retrieves only Approved meal plans for the logged-in patient, containing Sri Lankan meal schedules, portion sizes, recipes, calorie targets, and doctor instructions.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Approved meal plans list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/MealPlan' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // =========================================================================
    // PATIENT - PROGRESS TRACKING
    // =========================================================================
    '/api/patient/progress': {
      get: {
        tags: ['Patient - Progress Tracking'],
        summary: 'Get patient\'s weight & BMI progress history',
        description: 'Retrieves all self-reported weight progress entries and calculated BMI trends sorted chronologically.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Progress records timeline',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ProgressRecord' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Patient - Progress Tracking'],
        summary: 'Add a new progress record',
        description: 'Logs a new weight measurement (20-400 kg), automatically calculates BMI using profile height, checks for same-day duplicates, and updates the patient\'s current BMI and weight.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AddProgressRecordRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Progress record added and profile updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/ProgressRecord' }
                  }
                }
              }
            }
          },
          400: { description: 'Weight outside 20-400 kg range, future date, or patient height not recorded in profile' },
          409: { description: 'A progress record already exists for this date' }
        }
      }
    },
    '/api/patient/progress/{id}': {
      put: {
        tags: ['Patient - Progress Tracking'],
        summary: 'Update an existing progress record',
        description: 'Updates weight, notes, adherence, or activity for an existing progress entry, re-calculating BMI and updating the patient profile if it represents the latest record.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Progress Record ID',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProgressRecordRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Progress record updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/ProgressRecord' }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid weight range' },
          404: { description: 'Progress record not found or does not belong to patient' }
        }
      }
    },

    // =========================================================================
    // PATIENT - REPORTS
    // =========================================================================
    '/api/patient/reports/generate': {
      get: {
        tags: ['Patient - Reports'],
        summary: 'Generate personal patient health report',
        description: 'Generates personal health, assessment, meal plan, or weight progress report data for the logged-in patient.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'reportType',
            in: 'query',
            required: true,
            description: 'Report category',
            schema: {
              type: 'string',
              enum: ['Personal Health Report', 'Obesity Assessment Report', 'Meal Plan Report', 'Progress Report']
            }
          }
        ],
        responses: {
          200: {
            description: 'Patient report data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          400: { description: 'Missing or invalid reportType' }
        }
      }
    }
  },

  // ===========================================================================
  // COMPONENTS (SCHEMAS & SECURITY)
  // ===========================================================================
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the JWT token obtained from `/api/auth/login`. Swagger UI automatically prefixes it with `Bearer `'
      }
    },
    schemas: {
      // Standard Response Envelopes
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully.' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Detailed error explanation.' }
        }
      },

      // Auth Request & Responses
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'dob', 'gender'],
        properties: {
          fullName: { type: 'string', example: 'Kavindu Perera' },
          email: { type: 'string', format: 'email', example: 'patient@example.com' },
          password: { type: 'string', minLength: 8, example: 'PatientSecurePass123!' },
          dob: { type: 'string', format: 'date', example: '1998-05-14' },
          gender: { type: 'string', enum: ['Male', 'Female', 'Other'], example: 'Male' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'doctor@example.com' },
          password: { type: 'string', example: 'DoctorPass123!' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              _id: { type: 'string', example: '6650a1b2c3d4e5f678901234' },
              fullName: { type: 'string', example: 'Dr. Sarah Smith' },
              email: { type: 'string', example: 'doctor@example.com' },
              role: { type: 'string', enum: ['patient', 'doctor', 'admin'], example: 'doctor' }
            }
          }
        }
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string', example: 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890' },
          newPassword: { type: 'string', minLength: 8, example: 'NewPermanentPass123!' }
        }
      },

      // Database Models & Entities
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6650a1b2c3d4e5f678901234' },
          fullName: { type: 'string', example: 'Dr. Nimal Silva' },
          email: { type: 'string', example: 'nimal.silva@hospital.lk' },
          role: { type: 'string', enum: ['patient', 'doctor', 'admin'], example: 'doctor' },
          status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Doctor: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          phoneNumber: { type: 'string', example: '+94771234567' },
          specialisation: { type: 'string', example: 'Clinical Nutrition & Endocrinology' },
          qualification: { type: 'string', example: 'MBBS, MD in Endocrinology' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      DoctorDetail: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          status: { type: 'string' },
          profile: { $ref: '#/components/schemas/Doctor' },
          stats: {
            type: 'object',
            properties: {
              assignedPatientsCount: { type: 'integer', example: 12 },
              upcomingAppointmentsCount: { type: 'integer', example: 4 },
              completedAppointmentsCount: { type: 'integer', example: 28 }
            }
          }
        }
      },
      DoctorWithStats: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          status: { type: 'string' },
          profile: { $ref: '#/components/schemas/Doctor' },
          assignedPatientsCount: { type: 'integer' },
          totalAppointmentsCount: { type: 'integer' }
        }
      },
      DoctorListItem: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          specialisation: { type: 'string' },
          qualification: { type: 'string' },
          phoneNumber: { type: 'string' }
        }
      },
      Patient: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          userId: { type: 'string' },
          phoneNumber: { type: 'string' },
          assignedDoctor: { type: 'string' },
          assignedDoctorAt: { type: 'string', format: 'date-time' },
          height: { type: 'number', description: 'Height in cm', example: 172 },
          weight: { type: 'number', description: 'Weight in kg', example: 84.5 },
          currentBmi: { type: 'number', example: 28.56 },
          dob: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
          medicalHistory: { type: 'string' },
          healthDetails: { $ref: '#/components/schemas/HealthDetails' },
          profileCompleted: { type: 'boolean' },
          onboardingStatus: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      PatientListItem: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          status: { type: 'string' },
          profile: { $ref: '#/components/schemas/Patient' },
          assignedDoctor: { $ref: '#/components/schemas/User' }
        }
      },
      PatientDetail: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          status: { type: 'string' },
          profile: { $ref: '#/components/schemas/Patient' },
          assignedDoctor: { $ref: '#/components/schemas/User' },
          doctorNotes: { type: 'array', items: { $ref: '#/components/schemas/DoctorNote' } },
          latestAssessment: { $ref: '#/components/schemas/Assessment' },
          latestMealPlan: { $ref: '#/components/schemas/MealPlan' }
        }
      },
      HealthDetails: {
        type: 'object',
        properties: {
          familyHistoryOverweight: { type: 'string', enum: ['yes', 'no', ''], example: 'yes' },
          highCalorieFoodConsumption: { type: 'string', enum: ['yes', 'no', ''], example: 'yes' },
          vegetableConsumption: { type: 'number', minimum: 1, maximum: 3, example: 2 },
          mainMealsPerDay: { type: 'number', minimum: 1, maximum: 4, example: 3 },
          foodBetweenMeals: { type: 'string', enum: ['no', 'Sometimes', 'Frequently', 'Always', ''], example: 'Sometimes' },
          waterConsumption: { type: 'number', minimum: 1, maximum: 3, example: 2 },
          calorieMonitoring: { type: 'string', enum: ['yes', 'no', ''], example: 'no' },
          smokingStatus: { type: 'string', enum: ['yes', 'no', ''], example: 'no' },
          alcoholConsumption: { type: 'string', enum: ['no', 'Sometimes', 'Frequently', 'Always', ''], example: 'Sometimes' },
          physicalActivity: { type: 'number', minimum: 0, maximum: 3, example: 1 },
          technologyUsage: { type: 'number', minimum: 0, maximum: 24, example: 2 },
          transportationMethod: { type: 'string', enum: ['Automobile', 'Motorbike', 'Bike', 'Public_Transportation', 'Walking', ''], example: 'Public_Transportation' },
          dietaryPreference: { type: 'string', enum: ['None', 'No Special Preference', 'Vegetarian', 'Vegan', ''], example: 'No Special Preference' },
          foodAllergies: { type: 'array', items: { type: 'string' }, example: ['Peanuts', 'Dairy'] },
          medicalConditions: { type: 'array', items: { type: 'string' }, example: ['Hypertension'] },
          dislikedFoods: { type: 'array', items: { type: 'string' }, example: ['Bitter Gourd'] }
        }
      },
      Appointment: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6650b2c3d4e5f67890123456' },
          patientId: { $ref: '#/components/schemas/User' },
          doctorId: { $ref: '#/components/schemas/User' },
          date: { type: 'string', format: 'date-time' },
          time: { type: 'string', example: '10:30' },
          reason: { type: 'string', example: 'Routine obesity management checkup' },
          patientNote: { type: 'string' },
          status: { type: 'string', enum: ['pending', 'approved', 'completed', 'cancelled', 'rejected'], example: 'approved' },
          rejectionReason: { type: 'string' },
          cancellationReason: { type: 'string' },
          rescheduleNote: { type: 'string' },
          adminNote: { type: 'string' },
          consultationNote: { type: 'string', example: 'Patient responding well to calorie deficit. Advised 30 min daily brisk walking.' },
          followUpRequired: { type: 'boolean', example: true },
          suggestedFollowUpDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Assessment: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: '6650c3d4e5f6789012345678' },
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          height: { type: 'number', description: 'Height in metres', example: 1.72 },
          weight: { type: 'number', description: 'Weight in kg', example: 85.0 },
          bmi: { type: 'number', example: 28.73 },
          inputs: { type: 'object', description: 'Complete 17-feature vector sent to ML model' },
          mealPlanRequirements: {
            type: 'object',
            properties: {
              dietaryPreference: { type: 'string' },
              foodAllergies: { type: 'array', items: { type: 'string' } },
              medicalConditions: { type: 'array', items: { type: 'string' } },
              dislikedFoods: { type: 'array', items: { type: 'string' } }
            }
          },
          obesityClass: {
            type: 'string',
            enum: ['Insufficient_Weight', 'Normal_Weight', 'Overweight_Level_I', 'Overweight_Level_II', 'Obesity_Type_I', 'Obesity_Type_II', 'Obesity_Type_III'],
            example: 'Overweight_Level_II'
          },
          confidenceScore: { type: 'number', example: 92.4 },
          topProbabilities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                class: { type: 'string' },
                probability: { type: 'number' }
              }
            }
          },
          doctorNote: { type: 'string' },
          isApproved: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      MealSnapshot: {
        type: 'object',
        properties: {
          templateId: { type: 'string' },
          mealType: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'] },
          name: { type: 'string', example: 'String Hoppers with Dhal and Pol Sambol' },
          description: { type: 'string' },
          portionSize: { type: 'string', example: '10 string hoppers with 1/2 cup dhal' },
          calories: { type: 'number', example: 300 },
          protein: { type: 'number', example: 8 },
          carbohydrates: { type: 'number', example: 50 },
          fat: { type: 'number', example: 6 },
          fiber: { type: 'number', example: 5 },
          ingredients: { type: 'array', items: { type: 'string' } },
          allergens: { type: 'array', items: { type: 'string' } }
        }
      },
      MealPlan: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          assessmentId: { type: 'string' },
          obesityClass: { type: 'string', example: 'Overweight_Level_II' },
          bmi: { type: 'number', example: 28.73 },
          bmr: { type: 'number', example: 1740 },
          activityFactor: { type: 'number', example: 1.375 },
          tdee: { type: 'number', example: 2393 },
          calorieAdjustment: { type: 'number', example: -400 },
          dailyCalorieTarget: { type: 'number', example: 1993 },
          totalMealCalories: { type: 'number', example: 1950 },
          calorieDifference: { type: 'number', example: -43 },
          totalProtein: { type: 'number', example: 78 },
          totalCarbohydrates: { type: 'number', example: 245 },
          totalFat: { type: 'number', example: 48 },
          totalFiber: { type: 'number', example: 32 },
          dietaryPreference: { type: 'string', example: 'No Special Preference' },
          allergies: { type: 'array', items: { type: 'string' } },
          medicalConditions: { type: 'array', items: { type: 'string' } },
          dislikedFoods: { type: 'array', items: { type: 'string' } },
          meals: { type: 'array', items: { $ref: '#/components/schemas/MealSnapshot' } },
          waterTarget: { type: 'string', example: '2.5 - 3.0 Litres/day' },
          foodsToAvoid: { type: 'array', items: { type: 'string' } },
          exerciseRecommendation: { type: 'string', example: '30 minutes moderate cardio 5 days/week' },
          doctorInstructions: { type: 'string', example: 'Limit oil in sambol, consume green tea after lunch.' },
          medicalConditionWarningAcknowledged: { type: 'boolean' },
          status: { type: 'string', enum: ['Draft', 'Approved'], example: 'Approved' },
          approvedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      DoctorNote: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          note: { type: 'string', example: 'Patient blood pressure normal. Weight reduction target 0.5kg/week.' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      ProgressRecord: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          patientId: { type: 'string' },
          weight: { type: 'number', example: 83.2 },
          bmi: { type: 'number', example: 28.12 },
          mealAdherence: { type: 'string', enum: ['Not Followed', 'Partially Followed', 'Mostly Followed', 'Fully Followed', 'Not Applicable'], example: 'Mostly Followed' },
          physicalActivity: { type: 'string', enum: ['None', 'Light', 'Moderate', 'High'], example: 'Moderate' },
          note: { type: 'string', example: 'Felt energetic throughout the week' },
          date: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },

      // Request Payloads
      CreateDoctorRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password', 'phoneNumber', 'specialisation', 'qualification'],
        properties: {
          fullName: { type: 'string', example: 'Dr. Ruwan Fernando' },
          email: { type: 'string', format: 'email', example: 'ruwan.fernando@hospital.lk' },
          password: { type: 'string', minLength: 8, example: 'TempDoctorPass123!' },
          phoneNumber: { type: 'string', example: '+94777123456' },
          specialisation: { type: 'string', example: 'Bariatric Medicine' },
          qualification: { type: 'string', example: 'MBBS, MD' },
          status: { type: 'string', enum: ['active', 'inactive'], default: 'active' }
        }
      },
      UpdateDoctorRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string', example: 'Dr. Ruwan Fernando' },
          email: { type: 'string', format: 'email' },
          phoneNumber: { type: 'string' },
          specialisation: { type: 'string' },
          qualification: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          password: { type: 'string', minLength: 8 }
        }
      },
      AssignDoctorRequest: {
        type: 'object',
        required: ['doctorId'],
        properties: {
          doctorId: { type: 'string', description: 'Doctor User ID (or null to unassign)', example: '6650a1b2c3d4e5f678901234' }
        }
      },
      UpdateAppointmentStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['approved', 'rejected', 'cancelled'], example: 'approved' },
          rejectionReason: { type: 'string', example: 'Doctor on leave on selected day' },
          cancellationReason: { type: 'string', example: 'Clinic closed for renovation' },
          adminNote: { type: 'string', example: 'Assigned to Dr. Silva for specialist consultation' }
        }
      },
      RescheduleAppointmentRequest: {
        type: 'object',
        required: ['date', 'time', 'rescheduleNote'],
        properties: {
          date: { type: 'string', format: 'date', example: '2026-09-15' },
          time: { type: 'string', example: '14:00' },
          doctorId: { type: 'string', description: 'Optional new doctor User ID' },
          rescheduleNote: { type: 'string', example: 'Rescheduled due to doctor clinic timing shift' }
        }
      },
      AdminReportRequest: {
        type: 'object',
        required: ['reportType'],
        properties: {
          reportType: {
            type: 'string',
            enum: ['patient', 'doctor', 'appointment', 'obesity_classification', 'patient_progress'],
            example: 'obesity_classification'
          },
          startDate: { type: 'string', format: 'date', example: '2026-01-01' },
          endDate: { type: 'string', format: 'date', example: '2026-12-31' },
          doctorId: { type: 'string' },
          status: { type: 'string' }
        }
      },
      UpdateHealthDetailsRequest: {
        type: 'object',
        properties: {
          familyHistoryOverweight: { type: 'string', enum: ['yes', 'no', ''] },
          highCalorieFoodConsumption: { type: 'string', enum: ['yes', 'no', ''] },
          vegetableConsumption: { type: 'number', minimum: 1, maximum: 3 },
          mainMealsPerDay: { type: 'number', minimum: 1, maximum: 4 },
          foodBetweenMeals: { type: 'string', enum: ['no', 'Sometimes', 'Frequently', 'Always', ''] },
          waterConsumption: { type: 'number', minimum: 1, maximum: 3 },
          calorieMonitoring: { type: 'string', enum: ['yes', 'no', ''] },
          smokingStatus: { type: 'string', enum: ['yes', 'no', ''] },
          alcoholConsumption: { type: 'string', enum: ['no', 'Sometimes', 'Frequently', 'Always', ''] },
          physicalActivity: { type: 'number', minimum: 0, maximum: 3 },
          technologyUsage: { type: 'number', minimum: 0, maximum: 24 },
          transportationMethod: { type: 'string', enum: ['Automobile', 'Motorbike', 'Bike', 'Public_Transportation', 'Walking', ''] },
          dietaryPreference: { type: 'string', enum: ['None', 'No Special Preference', 'Vegetarian', 'Vegan', ''] },
          foodAllergies: { type: 'array', items: { type: 'string' } },
          medicalConditions: { type: 'array', items: { type: 'string' } },
          dislikedFoods: { type: 'array', items: { type: 'string' } }
        }
      },
      AddDoctorNoteRequest: {
        type: 'object',
        required: ['note'],
        properties: {
          note: { type: 'string', maxLength: 5000, example: 'Patient blood pressure normal. Weight reduction target 0.5kg/week.' }
        }
      },
      UpdateDoctorNoteRequest: {
        type: 'object',
        required: ['note'],
        properties: {
          note: { type: 'string', maxLength: 5000, example: 'Updated note: Patient blood pressure normal. Target adjusted to 0.75kg/week.' }
        }
      },
      CompleteAppointmentRequest: {
        type: 'object',
        required: ['consultationNote'],
        properties: {
          consultationNote: { type: 'string', maxLength: 2000, example: 'Patient advised on 1800kcal diet. High compliance observed.' },
          followUpRequired: { type: 'boolean', default: false, example: true },
          suggestedFollowUpDate: { type: 'string', format: 'date', example: '2026-10-15' }
        }
      },
      PredictObesityRequest: {
        type: 'object',
        required: ['patientId', 'Age', 'Gender', 'Height', 'Weight'],
        properties: {
          patientId: { type: 'string', example: '6650a1b2c3d4e5f678901234' },
          Age: { type: 'number', example: 28 },
          Gender: { type: 'string', enum: ['Male', 'Female'], example: 'Male' },
          Height: { type: 'number', description: 'Height in metres', example: 1.75 },
          Weight: { type: 'number', description: 'Weight in kg', example: 88 },
          FAVC: { type: 'string', enum: ['yes', 'no'], example: 'yes' },
          FCVC: { type: 'number', minimum: 1, maximum: 3, example: 2 },
          NCP: { type: 'number', minimum: 1, maximum: 4, example: 3 },
          CAEC: { type: 'string', enum: ['no', 'Sometimes', 'Frequently', 'Always'], example: 'Sometimes' },
          CH2O: { type: 'number', minimum: 1, maximum: 3, example: 2 },
          SCC: { type: 'string', enum: ['yes', 'no'], example: 'no' },
          CALC: { type: 'string', enum: ['no', 'Sometimes', 'Frequently', 'Always'], example: 'Sometimes' },
          family_history_with_overweight: { type: 'string', enum: ['yes', 'no'], example: 'yes' },
          SMOKE: { type: 'string', enum: ['yes', 'no'], example: 'no' },
          FAF: { type: 'number', minimum: 0, maximum: 3, example: 1 },
          TUE: { type: 'number', minimum: 0, maximum: 24, example: 2 },
          MTRANS: { type: 'string', enum: ['Automobile', 'Motorbike', 'Bike', 'Public_Transportation', 'Walking'], example: 'Public_Transportation' },
          mealPlanRequirements: {
            type: 'object',
            properties: {
              dietaryPreference: { type: 'string', example: 'No Special Preference' },
              foodAllergies: { type: 'array', items: { type: 'string' }, example: ['Peanuts'] },
              medicalConditions: { type: 'array', items: { type: 'string' } },
              dislikedFoods: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      },
      PredictionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              inputs: { type: 'object' },
              patientId: { type: 'string' },
              bmi: { type: 'number', example: 28.73 },
              height: { type: 'number', example: 1.75 },
              weight: { type: 'number', example: 88 },
              prediction: {
                type: 'object',
                properties: {
                  obesityClass: { type: 'string', example: 'Overweight_Level_II' },
                  confidenceScore: { type: 'number', example: 91.5 },
                  topProbabilities: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        class: { type: 'string' },
                        probability: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      SaveAssessmentRequest: {
        type: 'object',
        required: ['patientId', 'inputs', 'height', 'weight'],
        properties: {
          patientId: { type: 'string' },
          inputs: { type: 'object', description: '17-feature input object' },
          height: { type: 'number', description: 'Height in metres', example: 1.75 },
          weight: { type: 'number', description: 'Weight in kg', example: 88 },
          mealPlanRequirements: { type: 'object' },
          doctorNote: { type: 'string', example: 'Patient agreed to dietary interventions.' }
        }
      },
      GenerateMealPlanRequest: {
        type: 'object',
        required: ['assessmentId'],
        properties: {
          assessmentId: { type: 'string', example: '6650c3d4e5f6789012345678' }
        }
      },
      GeneratedMealPlanPayload: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          doctorId: { type: 'string' },
          assessmentId: { type: 'string' },
          obesityClass: { type: 'string' },
          bmi: { type: 'number' },
          bmr: { type: 'number' },
          activityFactor: { type: 'number' },
          tdee: { type: 'number' },
          calorieAdjustment: { type: 'number' },
          dailyCalorieTarget: { type: 'number' },
          totalMealCalories: { type: 'number' },
          totalProtein: { type: 'number' },
          totalCarbohydrates: { type: 'number' },
          totalFat: { type: 'number' },
          totalFiber: { type: 'number' },
          meals: { type: 'array', items: { $ref: '#/components/schemas/MealSnapshot' } },
          alternatives: {
            type: 'object',
            properties: {
              Breakfast: { type: 'array', items: { $ref: '#/components/schemas/MealSnapshot' } },
              Lunch: { type: 'array', items: { $ref: '#/components/schemas/MealSnapshot' } },
              Dinner: { type: 'array', items: { $ref: '#/components/schemas/MealSnapshot' } },
              Snack: { type: 'array', items: { $ref: '#/components/schemas/MealSnapshot' } }
            }
          },
          warnings: { type: 'array', items: { type: 'string' } }
        }
      },
      AlternativeMealsRequest: {
        type: 'object',
        required: ['mealType'],
        properties: {
          mealType: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], example: 'Lunch' },
          assessmentId: { type: 'string' },
          mealPlanId: { type: 'string' },
          excludeTemplateId: { type: 'string' }
        }
      },
      SaveMealPlanDraftRequest: {
        type: 'object',
        required: ['assessmentId', 'templateIds'],
        properties: {
          assessmentId: { type: 'string' },
          templateIds: { type: 'array', items: { type: 'string' }, example: ['6650d1...', '6650d2...', '6650d3...', '6650d4...'] },
          waterTarget: { type: 'string', example: '2.5 Litres/day' },
          foodsToAvoid: { type: 'array', items: { type: 'string' }, example: ['Sugary beverages', 'Deep fried snacks'] },
          exerciseRecommendation: { type: 'string', example: '30 min daily walking' },
          doctorInstructions: { type: 'string', example: 'Follow low GI rice portions.' },
          medicalConditionWarningAcknowledged: { type: 'boolean', example: true }
        }
      },
      UpdateMealPlanDraftRequest: {
        type: 'object',
        required: ['templateIds'],
        properties: {
          templateIds: { type: 'array', items: { type: 'string' } },
          dailyCalorieTarget: { type: 'number', example: 1900 },
          waterTarget: { type: 'string' },
          foodsToAvoid: { type: 'array', items: { type: 'string' } },
          exerciseRecommendation: { type: 'string' },
          doctorInstructions: { type: 'string' },
          medicalConditionWarningAcknowledged: { type: 'boolean' }
        }
      },
      RequestAppointmentRequest: {
        type: 'object',
        required: ['doctorId', 'date', 'time'],
        properties: {
          doctorId: { type: 'string', example: '6650a1b2c3d4e5f678901234' },
          date: { type: 'string', format: 'date', example: '2026-09-20' },
          time: { type: 'string', example: '09:30' },
          reason: { type: 'string', example: 'Follow-up consultation on meal plan' },
          patientNote: { type: 'string', example: 'Experiencing mild fatigue after exercise' }
        }
      },
      AddProgressRecordRequest: {
        type: 'object',
        required: ['weight'],
        properties: {
          weight: { type: 'number', minimum: 20, maximum: 400, example: 83.5 },
          date: { type: 'string', format: 'date', example: '2026-08-22' },
          mealAdherence: { type: 'string', enum: ['Not Followed', 'Partially Followed', 'Mostly Followed', 'Fully Followed', 'Not Applicable'], default: 'Mostly Followed' },
          physicalActivity: { type: 'string', enum: ['None', 'Light', 'Moderate', 'High'], default: 'Moderate' },
          note: { type: 'string', example: 'Completed 4 days of recommended meal plans.' }
        }
      },
      UpdateProgressRecordRequest: {
        type: 'object',
        properties: {
          weight: { type: 'number', minimum: 20, maximum: 400, example: 83.0 },
          mealAdherence: { type: 'string', enum: ['Not Followed', 'Partially Followed', 'Mostly Followed', 'Fully Followed', 'Not Applicable'] },
          physicalActivity: { type: 'string', enum: ['None', 'Light', 'Moderate', 'High'] },
          note: { type: 'string' }
        }
      },

      // Dashboard Analytics Responses
      AdminDashboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              metrics: {
                type: 'object',
                properties: {
                  totalDoctors: { type: 'integer', example: 8 },
                  totalPatients: { type: 'integer', example: 45 },
                  activePatients: { type: 'integer', example: 42 },
                  pendingAppointments: { type: 'integer', example: 3 },
                  approvedAppointments: { type: 'integer', example: 12 },
                  completedAppointments: { type: 'integer', example: 68 }
                }
              },
              charts: {
                type: 'object',
                properties: {
                  obesityDistribution: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'Overweight_Level_I' },
                        value: { type: 'integer', example: 14 },
                        color: { type: 'string', example: '#f59e0b' }
                      }
                    }
                  },
                  monthlyTrends: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        month: { type: 'string', example: 'Aug' },
                        appointments: { type: 'integer', example: 18 },
                        registrations: { type: 'integer', example: 7 }
                      }
                    }
                  }
                }
              },
              recentRegistrations: { type: 'array', items: { $ref: '#/components/schemas/User' } },
              recentAppointments: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } }
            }
          }
        }
      },
      DoctorDashboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              metrics: {
                type: 'object',
                properties: {
                  assignedPatients: { type: 'integer', example: 12 },
                  todayAppointments: { type: 'integer', example: 3 },
                  completedAssessments: { type: 'integer', example: 18 },
                  awaitingAssessment: { type: 'integer', example: 2 },
                  highRiskPatients: { type: 'integer', example: 4 },
                  approvedMealPlans: { type: 'integer', example: 15 }
                }
              },
              todaySchedule: { type: 'array', items: { $ref: '#/components/schemas/Appointment' } },
              recentPredictions: { type: 'array', items: { $ref: '#/components/schemas/Assessment' } }
            }
          }
        }
      },
      PatientDashboardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              metrics: {
                type: 'object',
                properties: {
                  currentBmi: { type: 'number', example: 28.5 },
                  latestClassification: { type: 'string', example: 'Overweight_Level_I' },
                  currentWeight: { type: 'number', example: 84.0 },
                  weightChange: { type: 'number', example: -2.5 }
                }
              },
              nextAppointment: { $ref: '#/components/schemas/Appointment' },
              latestAssessment: { $ref: '#/components/schemas/Assessment' },
              latestMealPlan: { $ref: '#/components/schemas/MealPlan' },
              progressTimeline: { type: 'array', items: { type: 'object' } },
              notifications: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      }
    }
  }
};

export const swaggerUiOptions = {
  customSiteTitle: 'Obesity Management System – API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 25px 0; }
    .swagger-ui .info .title { font-family: Inter, system-ui, sans-serif; font-weight: 700; color: #0f172a; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 15px 0; box-shadow: none; border-bottom: 1px solid #e2e8f0; }
    .swagger-ui .btn.authorize { background-color: #0d9488; border-color: #0d9488; color: #fff; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    tagsSorter: 'alpha'
  }
};

export { swaggerUi };
