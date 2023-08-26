# node-auth

Simple User Management API

<br>

### **Users**

Operations available to regular users

---

#### POST `/api/v1/register` - Registers a new user

Request body:

```
{
  "username": "username",
  "email": "user@email.com",
  "password": "password"
}
```

Responses:
| Code | Description |
|------|----------------|
| 201 | User’s created |
| 400 | Invalid input |
| 409 | User exists |

<br>

#### POST `/api/v1/login` - Logs into the system

Request body:

```
{
  "email": "user@email.com",
  "password": "password"
}
```

Responses:
| Code | Description |
|------|-----------------------------|
| 200 | User’s logged in |
| 400 | Invalid input, invalid user |

<br>

#### PATCH `/api/v1/update` - Updates user's information

Request body:

```
{
  "username": "username",
  "email": "user@email.com",
  "password": "password"
}
```

Responses:
| Code | Description |
|------|----------------------|
| 200 | User’s updated |
| 401 | Unauthorized request |
| 404 | User’s not found |

<br>

#### GET `/api/v1/user` - Returns the current user’s information

Response body:

```
{
  "username": "username",
  "email": "user@email.com",
  "admin": false
}
```

Responses:
| Code | Description |
|------|----------------------|
| 200 | User’s updated |
| 401 | Unauthorized request |

<br>

#### GET `/api/v1/logout` - Logs out from the system

Log out from the system and clear cookies

Responses:
| Code | Description |
|------|-------------------|
| 200 | User’s logged out |

<br>

### **Admins**

Operations available only to admins

---

<br>

#### PATCH `/api/v1/update` - Updates user's information

Update user information and permission

Request body:

```
{
  "username": "username",
  "email": "user@email.com",
  "password": "password",
  "isAdmin": true
}
```

Responses:
| Code | Description |
|------|----------------------|
| 200 | User’s updated |
| 401 | Unauthorized request |
| 404 | User’s not found |

<br>

#### GET `/api/v1/users` - Returns users

Returns a list of users

Query parameters:

```
username: The username to return
email: The email to return
isAdmin: Returns a permission group
```

Response body:

```
[
  {
    "username": "username",
    "email": "user@email.com",
    "isAdmin": true
  }
]
```

Responses:
| Code | Description |
|------|----------------------|
| 200 | Search results |
| 401 | Unauthorized request |
