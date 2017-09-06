use strict;
use warnings;
use stdlib::util;
use stdlib::array;
use stdlib::hashmap;
use stdlib::integer;
use stdlib::string;
use stdlib::boolean;


my $a = stdlib::string->new("' hello '");
{
  my $b = stdlib::string->new("' world '");
  $a->trim();
  $a->concat($b->valueOf());
};
my $a = $a->valueOf();
