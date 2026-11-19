# Security checks for the public catalogue

| Area | Current control | Verification |
| --- | --- | --- |
| Public access | The catalogue, example source and search fixture contain public, synthetic data. | Check the [public endpoints](../routes/web.php) and the fields returned by the fixture. Reassess access rules before adding private resources. |
| Input validation | Slugs resolve against the registry. The demo JSON endpoint accepts a bounded string query. | Exercise a missing slug, an array-valued query and an overlength query with the PHP suite. |
| Output handling | React renders code samples as text. The standalone page demo uses a sandboxed iframe with scripts and an isolated origin. | Inspect the iframe permissions and exercise the real sample in the entry page. |
| Credentials | The checked-in environment example has no application key. Local environment files and credentials are ignored. | Inspect staged files before publication and use a fresh local key. |
| Supply chain | Composer and npm lockfiles define the installed dependency versions. | Install from the locks, run the suite, and review dependency advisories during upgrades. |
| AI resources | The catalogue publishes instructions and a synthetic example. A visitor explicitly supplies the input to their chosen tool. | Check the handoff for instructions that request credentials, private logs or employer material. |
| Runtime | The Docker demonstration binds its host port to loopback. | Verify the Compose configuration before starting the container. A public deployment needs a separate configuration review. |

Review these controls alongside the [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/). Entries involving accounts, uploads or persistent writes will introduce additional controls and tests.
