use strict;
use warnings;
use stdlib::util;
use stdlib::array;
use stdlib::hashmap;
use stdlib::integer;
use stdlib::string;
use stdlib::boolean;


my $a = stdlib::string->new("hello world!");
my $c = ""hey!"";
$a->updateValue('test');

my $b = stdlib::integer->new(5);
my $i = stdlib::integer->new(1);
$b->add($i->valueOf());


