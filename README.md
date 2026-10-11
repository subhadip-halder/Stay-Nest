# StayNest

StayNest is a full-stack vacation-rental listing application built with Node.js, Express, MongoDB, and EJS. Visitors can browse and search stays, open listing details, and read reviews. Registered users can create and manage their own listings, leave reviews, and manage their sessions.

The interface uses Bootstrap and custom CSS. Listing photos are stored with Cloudinary, and Mapbox geocoding supplies coordinates for listing maps.

## Live website

[Open StayNest](https://stay-nest-01.onrender.com/listings)

## Features

- Browse vacation-rental listings with photos, nightly prices, locations, and descriptions.
- Filter the currently loaded stays with the category chips.
- Search listings by title, location, or country. Search is case-insensitive and supports partial matches.
- View listing details, owner information, reviews, and a map when coordinates are available.
- Register, log in, and log out with Passport Local authentication.
- Create listings with an uploaded image and geocoded location.
- Edit or delete listings as their owner.
- Add reviews to listings and delete reviews as their author.
- Keep login sessions in MongoDB with `connect-mongo`.
- Show validation feedback and session flash messages.
- Toggle listing card prices between the base rate and an 18% GST-inclusive estimate.

## Technology

| Area | Technology |
| --- | --- |
| Server | Node.js, Express 5 |
| Views | EJS, `ejs-mate` |
| Database and models | MongoDB, Mongoose |
| Authentication | Passport, `passport-local`, `passport-local-mongoose` |
| Sessions | `express-session`, `connect-mongo` |
| Validation | Joi |
| Image uploads | Multer, Cloudinary, `multer-storage-cloudinary` |
| Geocoding and maps | Mapbox Geocoding API, Mapbox GL JS |
| UI | Bootstrap 5, Font Awesome, custom CSS |

## Requirements

- Node.js 26.7.0 (the version declared in `package.json`)
- npm
- A MongoDB Atlas connection string, or another MongoDB connection string supported by the MongoDB driver
- A Cloudinary account for uploading listing images
- A Mapbox access token for geocoding and map display

## Getting started

### 1. Clone and install

```bash
git clone <your-repository-url>
cd stayNest
npm install
```

Replace `<your-repository-url>` with the URL of your GitHub repository.

### 2. Configure environment variables

Configure these variables in your local environment before starting the app: `ATLASDB_URL`, `SECRET`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, and `MAP_TOKEN`. Do not commit credentials or publish their values. Use the connection string provided by your MongoDB deployment, and URL-encode special characters in its username or password when required.

`ATLASDB_URL` is used by the app for both listing data and the MongoDB-backed session store. `SECRET` signs session cookies and protects the session store. Cloudinary credentials are used by listing image uploads. `MAP_TOKEN` is used to geocode listing locations and render listing maps.

Keep local environment configuration private. The repository's `.gitignore` excludes `.env` files.

### 3. Start MongoDB access

For MongoDB Atlas, make sure the database user and network access rules permit connections from the machine running StayNest. A DNS or network connection failure will prevent the server from starting because the app connects to MongoDB before it listens for HTTP requests.

### 4. Run the application

```bash
npm start
```

For development with automatic restarts:

```bash
npm run dev
```

When the database connection succeeds, the app listens on port `8080`:

```text
http://localhost:8080/listings
```


## Routes

| Method | Path | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/listings` | Browse listings; accepts `?q=` to search title, location, and country | Public |
| `GET` | `/listings/:id` | View a listing and its reviews | Public |
| `GET` | `/listings/new` | Show the create-listing form | Signed in |
| `POST` | `/listings` | Create a listing and upload its image | Signed in |
| `GET` | `/listings/:id/edit` | Show the edit form | Listing owner |
| `PUT` | `/listings/:id` | Update a listing | Listing owner |
| `DELETE` | `/listings/:id` | Delete a listing | Listing owner |
| `POST` | `/listings/:id/reviews` | Add a review | Signed in |
| `DELETE` | `/listings/:id/reviews/:reviewId` | Delete a review | Review author |
| `GET` | `/signup` | Show the registration form | Public |
| `POST` | `/signup` | Register a user | Public |
| `GET` | `/login` | Show the login form | Public |
| `POST` | `/login` | Authenticate a user | Public |
| `POST` | `/logout` | End the current session | Any session |

The listing update and delete forms use `method-override` to submit `PUT` and `DELETE` requests from standard HTML forms.

## Search

The search form in the navbar submits a `GET` request to `/listings` using the `q` query parameter. For example:

```text
/listings?q=beach
```

Search checks the listing title, location, and country without regard to case. It treats input as literal text and limits the query length. The results page keeps the entered phrase visible and shows either a result count or a no-results message.

## Listing data and uploads

Listings include a title, description, image URL, price, location, country, owner, map coordinates, and reviews. Listing form data is validated with Joi before it is saved.

New listing images are sent to Cloudinary. The upload configuration currently accepts PNG, JPG, and JPEG files and stores them in the `stayNest_DEV` Cloudinary folder. New listing locations are geocoded with Mapbox before the listing is saved. Existing listings without coordinates may be geocoded when their detail page is opened, provided `MAP_TOKEN` is configured.

## Sample data

Sample listings are stored in `init/data.js`. The seed script is `init/index.js`, but it is **not safe to run against data you need to keep**. It currently connects to the local MongoDB database `mongodb://127.0.0.1:27017/staynest`, while the web app reads `ATLASDB_URL` from `.env`. The script deletes every listing in its target database before inserting sample data. It also expects an existing user in that database (`OWNER_ID` can select the user), while the sample listings do not currently include the required map geometry from the listing schema. As a result, the insert may fail after the existing listings have already been deleted.

Before using the seeder, point it at the intended database, ensure the owner account exists there, add valid geometry to each sample listing (or geocode the sample locations), and back up any data you need to keep. The script reads `OWNER_ID` from the process environment, not from `.env`; if needed, pass it when invoking the script:

```bash
OWNER_ID=<existing-user-id> node init/index.js
```

## Project structure

```text
stayNest/
├── app.js                    # Express app, middleware, routes, and startup
├── cloudConfig.js            # Cloudinary and Multer storage configuration
├── controllers/              # Listing, review, and user request handlers
├── init/                     # Sample listing data and database seeder
├── middleware.js             # Authentication, ownership, and validation guards
├── models/                   # Mongoose models for listings, reviews, and users
├── public/
│   ├── css/                  # Site and rating stylesheets
│   └── js/                   # Client-side behaviors and Mapbox map setup
├── routes/                   # Express route definitions
├── schema.js                 # Joi input schemas
├── utils/                    # Error, async, and flash-message helpers
└── views/
    ├── includes/             # Navbar, footer, and flash-message partials
    ├── layouts/              # Shared EJS layout
    ├── listings/             # Listing index, detail, create, and edit pages
    └── users/                # Signup and login pages
```

## Authentication and access control

Passport Local authenticates users with usernames and passwords. User passwords are managed by `passport-local-mongoose`; the application does not store raw passwords. Sessions are stored in MongoDB via `connect-mongo`.

Creating a listing requires a signed-in user. Editing and deleting a listing require its owner. Creating a review requires a signed-in user, and deleting a review requires its author. Listing and review request bodies are validated before saving.

## Troubleshooting

### The app exits before it starts listening

Check the startup output and confirm that `ATLASDB_URL` is set correctly. For Atlas deployments, verify the cluster hostname, database username and password, and the database network access list. `querySrv ECONNREFUSED` or DNS lookup errors indicate that the runtime cannot resolve or reach the cluster's SRV record.

### Image uploads fail

Confirm that `CLOUD_NAME`, `CLOUD_API_KEY`, and `CLOUD_API_SECRET` match the Cloudinary account. Check that the uploaded image uses PNG, JPG, or JPEG format.

### Listing creation fails during location lookup

Confirm that `MAP_TOKEN` is present and has permission to use Mapbox geocoding. Use a specific location and country in the listing form.

### The map is not visible on a listing

The map requires a valid `MAP_TOKEN` and saved coordinates. Listings with old or missing coordinates are geocoded when their detail page is visited, when Mapbox is configured and reachable.

### A protected page redirects to login

Creating listings and reviews requires signing in. Editing or deleting a listing additionally requires that the signed-in account owns it.

## Development notes

- The server uses `PORT` when provided by its host and defaults to `8080` locally.
- EJS templates use `ejs-mate` for layouts and partials.
- Flash messages are stored in the user session and rendered by the shared layout.
- The `npm test` script is currently a placeholder; no automated test suite is configured yet.
- Keep API credentials and session secrets in local environment variables. Never commit `.env` or production secrets.

## License

No license file is currently included. Add a `LICENSE` file before presenting this project as open source, and choose terms that match how you want others to use it.
