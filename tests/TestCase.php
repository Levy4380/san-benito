<?php

namespace Tests;

use Database\Seeders\RoleSeeder;
use Database\Seeders\SpecialtySeeder;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    protected function seedCatalog(): void
    {
        $this->seed(RoleSeeder::class);
        $this->seed(SpecialtySeeder::class);
    }
}
