# Manual configuration

To add mnually configuration parameters to uCoin, use `config` command:

```bash
$ ucoind config
```

## Currency

First of all, tell uCoin which currency to be used through command:

```bash
$ ucoind config --currency mycurrency
```

Replace `mycurrency` by the name of the currency you want to manage.
> This is **crucial** data. Be careful on the case and **do not change it** thereafter otherwise your node will have incoherent data & behaviors.

## Network parameters

By default, ucoin runs on port 8033. You may change it using the --port parameter:

```bash
$ ucoind config --port 80
```

(may require root access to launch on port 80)

It is also possible to specify the IPv4 interface:

```bash
$ ucoind config -p 8888 --ipv4 127.0.0.1
```

Or IPv6 interface:

```bash
$ ucoind config -p 8888 --ipv6 ::1
```

Or both:

```bash
$ ucoind config -p 8888 --ipv4 127.0.0.1 --ipv6 ::1
```

Launching uCoin (when completely configured) will results:

```bash
$ ucoind start

uCoin server listening on 127.0.0.1 port 8888
uCoin server listening on ::1 port 8888
```

Note too that listening to multiple interfaces doesn't imply mutiple program instances: only *one* is running on multiple interfaces.

## Remote parameters

### Peering informations

uCoin protocol uses peering mecanisms, hence needs any ucoin node to be reachable through the network.

As the server may be behind a reverse proxy, or because hosts may change of address, remote informations are likely to be different from listening host and port parameters. ucoin software defines 4 remote parameters you need to precise for your ucoin instance to be working:

* `--remoteh`
* `--remote4`
* `--remote6`
* `--remotep`

You must define at least `--remote4` and `--remotep` not to have any error. Here is an example:

```bash
$ ucoind config --remoteh "some.remote.url" --remotep "8844" --remote4 "11.11.11.11" --remote6 "::1"
```

Note that this is not required and may be removed in the future, as uCoin protocol already include peering mecanisms giving network informations.

### Authentication

uCoin protocol requires your responses to be signed in order to be interpreted. Such a feature is very important to authenticate nodes' messages. To use this feature, just configure uCoin using `--pgpkey` parameter:

```bash
$ ucoind config --pgpkey /path/to/private/key
```

Eventually, you might need to give a password, otherwise uCoin will crash:

```bash
$ ucoind config --pgppasswd "ultr[A]!%HiGhly-s3cuR3-p4ssw0d"
```

Resulting in:

```bash
$ ucoind start

Signed requests with PGP: enabled.
uCoin server listening on 127.0.0.1 port 8888
uCoin server listening on ::1 port 8888
```