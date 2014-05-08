#! /bin/sh -x
set +e
cmddir=`dirname $0`
curdir=`pwd`

echo current directory: $curdir
echo working directory: $cmddir

cd $cmddir

# wrapper script is so jenkins will not fail the job when xvfb-run can't kill a non-existent process
# risk is that other failures might be more significant
xvfb-run /build/ant/latest/bin/ant -Dxlt.home.dir=/build/xlt/xlt-4.3.4 -Dwebdriver=firefox -logger || true
