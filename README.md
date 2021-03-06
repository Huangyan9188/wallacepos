# WallacePOS
## An intuitive & modern web based POS system
![logo](https://wallacepos.com/images/wallacepos_logo_600.png)

WallacePOS uses the power of the modern web to provide an easy to use & extensible POS system.

It supports standard POS hardware including receipt printers, cashdraws and barcode scanners.

With a rich administration dashboard and reporting features, WallacePOS brings benefits to managers and staff alike.

Take your business into the cloud with WallacePOS!

To find out more about WallacePOS, head over to [wallacepos.com](https://wallacepos.com)

## Server Prerequisites

WallacePOS requires:

1. A Lamp server with PHP version>=5.4 and Apache version>=2.4.7 with modules rewrite and proxy_wstunnel.

    - You can enable proxy_wstunnel & rewrite by typing the following in your terminal

    ```
        sudo a2enmod proxy_wstunnel && a2enmod rewrite
    ```

    - The following virtual host snippet in your apache config, replace %*% with your values and modify to your needs.


    ```
        <VirtualHost *:443>
             DocumentRoot %/your_install_dir%
             ServerName %your.server.fqdn%

             ErrorLog ${APACHE_LOG_DIR}/error.log
             CustomLog ${APACHE_LOG_DIR}/access.log combined

             SSLEngine on
                 SSLCipherSuite !ADH:!DSS:!RC4:HIGH:+3DES:+RC4
                 SSLProtocol all -SSLv2 -SSLv3
                 SSLCertificateFile %certificate_location%
                 SSLCertificateKeyFile %key_location%
                 SSLCertificateChainFile %cert_chain_location%

             <Directory %/your_install_dir%>
                AllowOverride all
             </Directory>

             # WSPROXY CONF
             ProxyRequests Off
             ProxyPreserveHost On
             <Proxy *>
                     Order deny,allow
                     Allow from all
             </Proxy>
             ProxyPass /socket.io/1/websocket/ ws://localhost:8080/socket.io/1/websocket/
             ProxyPassReverse /socket.io/1/websocket/ ws://localhost:8080/socket.io/1/websocket
             ProxyPass /socket.io/ http://localhost:8080/socket.io/
             ProxyPassReverse /socket.io/ http://localhost:8080/socket.io/
             <Location /socket.io>
                     Order allow,deny
                     Allow from all
             </Location>
        </VirtualHost>
    ```

    Note: Using plain http is not recommended.

2. Node.js installed along with the socket.io library

    For a Debian distro:

    ```
        sudo apt-get update
        sudo apt-get install nodejs && apt-get install npm
        cd %/your_install_dir%
        sudo npm install
    ```

## Installation & Startup

1. Clone your chosen WallacePOS release to %your_install_dir% if you haven't done so already.

2. Configure the database by copying %your_install_dir%/library/wpos/dbconfig_template.php to %your_install_dir%/library/wpos/dbconfig.php and fill in your own values.

3. Install the database schema & templates:

    1. Enable the /library/installer/index.php file by removing the die(); command at the start
    2. Access library/installer/?install from the web browser to install the database schema

    OR

    1. Manually install the database schema at %your_install_dir%/library/installer/schemas/install.sql using your favoured sql management method.
    2. Copy docs-template folder to docs, make sure it is writable by your apache user (eg. www-data)

4. Login to the admin dashboard at /admin using credentials admin:admin, from the menu go to Settings -> Utilities and click the Start button under Feed Server

5. Change default passwords in Settings -> Staff & Admins!

## Deploying using dokku

To deploy WallacePOS on dokku:

1. Install [dokku-buildpack-multi](https://github.com/pauldub/dokku-multi-buildpack) on your dokku host

2. Fork the WallacePOS to a PRIVATE repo (IMPORTANT),  copy /library/wpos/dbconfig_template.php to dbconfig.php and fill in your own values

    **OR**

   Use my [dokku mysql plugin](https://github.com/micwallace/dokku-mysql-server-plugin) to create and link the database automagically

3. Deploy in the usual manner.

4. Login to the admin dashboard at /admin using credentials admin:admin & change the default passwords in Settings -> Staff & Admins!



